import { redis } from "../redis/redisClient";
import {
  activeQueueKey,
  matchReqKey,
  searchingTTLKey,
  lockKey,
  confirmKey,
} from "../redis/key";
import { MatchRequest } from "../models/MatchRequest";
import { getRedisMatchRequest } from "./redisHelpers";

// cleanup method in redis for user cancelled match request
export async function cancelMatchRequest(matchRequestId: string) {
  // Load the Redis match meta to know the location
  const data = await getRedisMatchRequest(matchRequestId);

  if (data) {
    const location = data.location;

    // Remove from sorted set
    await redis.zrem(activeQueueKey(location), matchRequestId);

    // Delete Redis hash
    await redis.del(matchReqKey(matchRequestId));

    // Delete TTL key so engine will not treat it as searching
    await redis.del(searchingTTLKey(matchRequestId));

    // Remove locks
    await redis.del(lockKey(matchRequestId));

    // Remove confirmation keys
    await redis.del(confirmKey(matchRequestId));
  }

  // Update Mongo status → cancelled
  await MatchRequest.findByIdAndUpdate(matchRequestId, { status: "cancelled" });
}
