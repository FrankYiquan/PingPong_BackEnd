import { redis } from "../redis/redisClient";
import {
  activeQueueKey,
  searchingTTLKey,
  lockKey,
  confirmKey,
  matchReqKey,
  avoidMatchKey,
} from "../redis/key";
import { Location, RedisMatchRequest } from "../types/matchmakingTypes";
import { getRedisMatchRequest } from "./redisHelpers";
import { MatchRequest } from "../models/MatchRequest";
import { Notifier } from "./notifier";

const LOCATIONS: Location[] = ["Gosman", "Shapiro", "IBS"];
const LOCK_TTL_SECONDS = 5;
const CONFIRM_TTL_SECONDS = 15;
const ELO_MAX_DIFF = 300;

// ---- Helpers ----

function timeOverlaps(a: RedisMatchRequest, b: RedisMatchRequest): boolean {
  return a.startTimeMs < b.endTimeMs && a.endTimeMs > b.startTimeMs;
}

function areCompatible(a: RedisMatchRequest, b: RedisMatchRequest): boolean {
  const eloDiff = Math.abs(a.elo - b.elo);
  return a.playerCount === b.playerCount && timeOverlaps(a, b) && eloDiff <= ELO_MAX_DIFF;
}

// acquire a lock key; other code MUST respect this flag
async function acquireLock(id: string): Promise<boolean> {
  const key = lockKey(id);
  const result = await redis.call(
    "SET",
    key,
    "locked",
    "NX",
    "EX",
    LOCK_TTL_SECONDS.toString()
  );
  return result === "OK";
}

async function releaseLock(id: string): Promise<void> {
  await redis.del(lockKey(id));
}

// If TTL has expired, clean from queue + Mongo, but only if:
// - not locked
// - still in "pending" status in Mongo
async function cleanupExpired(id: string, location: Location): Promise<void> {
  // 1. Check Lock First (Fast Redis check)
  // If locked, the match engine is processing them right now.
  const lockExists = await redis.exists(lockKey(id));
  if (lockExists) return;

  // 2. Check TTL Second (Fast Redis check) 
  // If TTL exists, they are active. Return immediately. 
  // Don't bother MongoDB.
  const ttlExists = await redis.exists(searchingTTLKey(id));
  if (ttlExists) return;

  // 3. If we get here, TTL is gone. 
  // It could be expired, OR they could have just been matched/cancelled 
  // and the TTL was deleted by another process.
  
  // atomically update ONLY if status is 'searching' -> Prevent RACE CONDITION
  const result = await MatchRequest.findOneAndUpdate(
    { _id: id, status: "searching" }, // Condition
    { status: "expired" },            // Update
    { new: true }
  );

  // 4. If result is null, it means the status was NOT 'searching' 
  // (e.g., they were matched, cancelled, or already expired).
  // In that case, we assume the other process(accept/decline, cancel) handled the Redis cleanup.
  if (result) {
    // We successfully marked them as expired, so now we clean Redis.
    await redis.zrem(activeQueueKey(location), id);
    await redis.del(matchReqKey(id));
    console.log(`[Cleanup] Request ${id} expired.`);
  } else {
    // Optional: Safety cleanup
    // If the doc doesn't exist at all (deleted manually?), remove from Redis
    const exists = await MatchRequest.exists({ _id: id });
    if (!exists) {
       await redis.zrem(activeQueueKey(location), id);
       await redis.del(matchReqKey(id));
    }
  }
}

// Move both to pending_confirmation
// NOTE: Order matters to avoid races with cleanupExpired:
//   1. Update Mongo (status = pending_confirmation)
//   2. Remove from queue + TTL / hashes
//   3. Set confirm keys
//   4. Notify
async function moveToPendingConfirmation(
  a: RedisMatchRequest,
  b: RedisMatchRequest,
  notifier: Notifier
) {
  const queueKey = activeQueueKey(a.location);

  // Only update if status is specifically 'searching'.
  // If user cancelled, status will be 'cancelled' and this query will return null.
  const [resA, resB] = await Promise.all([
    MatchRequest.findOneAndUpdate(
      { _id: a.matchRequestId, status: "searching" }, // Condition
      { status: "pending_confirmation", opponentRequestId: b.matchRequestId }, // Update
      { new: true }
    ).exec(),
    MatchRequest.findOneAndUpdate(
      { _id: b.matchRequestId, status: "searching" },
      { status: "pending_confirmation", opponentRequestId: a.matchRequestId },
      { new: true }
    ).exec(),
  ]);

  // Handle Race Conditions
  if (!resA || !resB) {
    console.log("[Engine] Race condition detected. One user cancelled.");

    // If A failed (was cancelled), but B succeeded, we must revert B back to searching!
    if (resB && !resA) {
      await MatchRequest.findByIdAndUpdate(b.matchRequestId, { 
        status: "searching", 
        opponentRequestId: null 
      });
      // B stays in Redis, A is ignored.
    }
    // If A succeeded but B failed, revert A.
    if (resA && !resB) {
      await MatchRequest.findByIdAndUpdate(a.matchRequestId, { 
        status: "searching", 
        opponentRequestId: null 
      });
    }

    // Since the match failed, we DO NOT proceed to notify or clear Redis for this pair.
    return;
  }
  // 2. Remove from queue and TTL markers (Success path)
  await redis.zrem(queueKey, a.matchRequestId, b.matchRequestId);

  await redis.del(
    searchingTTLKey(a.matchRequestId),
    searchingTTLKey(b.matchRequestId)
  );

  // 3. DELETE MATCH REQUEST DATA
  await redis.del(matchReqKey(a.matchRequestId), matchReqKey(b.matchRequestId));

  // 4. Set confirm keys
  await redis.set(confirmKey(a.matchRequestId), "waiting", "EX", CONFIRM_TTL_SECONDS);
  await redis.set(confirmKey(b.matchRequestId), "waiting", "EX", CONFIRM_TTL_SECONDS);

  // 4. Notify both users
  await notifier.notifyUser(a.userId, "MATCH_FOUND", {
    opponent: {
      username: b.username,
      elo: b.elo,
      creditScore: b.creditScore,
      profileImage: b.profileImage,
      location: b.location,
      startTimeMs: b.startTimeMs,
      endTimeMs: b.endTimeMs,
      matchRequestId: b.matchRequestId,
    },
  });

  await notifier.notifyUser(b.userId, "MATCH_FOUND", {
    opponent: {
      username: a.username,
      elo: a.elo,
      creditScore: a.creditScore,
      profileImage: a.profileImage,
      location: a.location,
      startTimeMs: a.startTimeMs,
      endTimeMs: a.endTimeMs,
      matchRequestId: a.matchRequestId,
    },
  });
}

// Try match within one location queue
async function tryMatchForLocation(location: Location, notifier: Notifier) {
  const queueKey = activeQueueKey(location);
  const ids = await redis.zrange(queueKey, 0, -1);

  if (ids.length < 2) return;

  for (let i = 0; i < ids.length; i++) {
    const idA = ids[i];

    // Expiration cleanup for A
    await cleanupExpired(idA, location);
    const ttlA = await redis.exists(searchingTTLKey(idA));
    if (!ttlA) continue;

    const lockA = await acquireLock(idA);
    if (!lockA) continue;

    // Reload A from Redis; it may have disappeared
    const a = await getRedisMatchRequest(idA);
    if (!a) {
      await releaseLock(idA);
      continue;
    }

    let matched = false;

    for (let j = i + 1; j < ids.length; j++) {
      const idB = ids[j];

      // Expiration cleanup for B
      await cleanupExpired(idB, location);
      const ttlB = await redis.exists(searchingTTLKey(idB));
      if (!ttlB) continue;

      const lockB = await acquireLock(idB);
      if (!lockB) continue;

      const b = await getRedisMatchRequest(idB);
      if (!b) {
        await releaseLock(idB);
        continue;
      }

      if (a.userId === b.userId) {
        console.log(`[Engine] Self-match detected for user ${a.userId}. Cleaning stale request ${idA}.`);
        
        // idA is the "older" one (because i < j in the sorted set).
        // We assume the older one is the stale/cancelled one.
        
        // 1. Remove A from Redis entirely
        const queueKey = activeQueueKey(location);
        await redis.zrem(queueKey, idA);
        await redis.del(matchReqKey(idA));
        await redis.del(searchingTTLKey(idA));
        
        // 2. Release locks
        await releaseLock(idA);
        await releaseLock(idB);
        
        // 3. Break the inner loop to stop processing 'A', effectively skipping to the next user in the outer loop
        break; 
      }

      // Check if these two users are temporarily blocked from matching
      const isBlocked = await redis.exists(avoidMatchKey(idA, idB));
      if (isBlocked) {
        await releaseLock(idB);
        continue; // Skip this pair, try next person
      }

      if (areCompatible(a, b)) {
        try {
          await moveToPendingConfirmation(a, b, notifier);
        } finally {
          await releaseLock(idA);
          await releaseLock(idB);
        }
        matched = true;
        break;
      } else {
        await releaseLock(idB);
      }
    }

    if (!matched) {
      await releaseLock(idA);
    }
  }
}

// prevent overlapping engine runs in one process
let engineRunning = false;

export function startMatchEngine(notifier: Notifier, intervalMs = 1000) {
  setInterval(async () => {
    if (engineRunning) return; // skip tick if previous one still running
    engineRunning = true;

    try {
      for (const location of LOCATIONS) {
        try {
          await tryMatchForLocation(location, notifier);
        } catch (err) {
          console.error("Error in match engine for location", location, err);
        }
      }
    } finally {
      engineRunning = false;
    }
  }, intervalMs);
}
