import { IMatchRequest } from "../types/modeTypes";
import { IUser } from "../types/modeTypes";
import { RedisMatchRequest } from "../types/matchmakingTypes";
import { redis } from "../redis/redisClient";

import {
  activeQueueKey,
  matchReqKey,
  searchingTTLKey,
} from "../redis/key";

const SEARCH_TTL_SECONDS = 30;

// Enqueue a match request into Redis
export async function enqueueMatchRequest(
  request: IMatchRequest,
  user: IUser
): Promise<void> {

  const id = request._id.toString();
  const now = Date.now();

  const payload: RedisMatchRequest = {
    matchRequestId: id,
    userId: user._id.toString(),
    location: request.location,
    avatar: user.profileImage,
    startTimeMs: request.startTime.getTime(),
    endTimeMs: request.endTime.getTime(),
    elo: user.elo,
    creditScore: user.creditScore,
    profileImage: user.profileImage,
    username: user.username,
    playerCount: request.playerCount as 2,
    createdAtMs: now,
  };

  // Store hash
  await redis.hset(matchReqKey(id), {
    matchRequestId: payload.matchRequestId,
    userId: payload.userId,
    location: payload.location,
    startTimeMs: payload.startTimeMs.toString(),
    endTimeMs: payload.endTimeMs.toString(),
    elo: payload.elo.toString(),
    creditScore: payload.creditScore.toString(),
    profileImage: payload.profileImage,
    username: payload.username,
    playerCount: payload.playerCount.toString(),
    createdAtMs: payload.createdAtMs.toString(),
  });

  // Add to location queue
  await redis.zadd(activeQueueKey(request.location), now, id);

  // TTL for search
  await redis.setex(searchingTTLKey(id), SEARCH_TTL_SECONDS, "active");
}
