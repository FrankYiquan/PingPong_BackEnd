import { redis } from "../redis/redisClient";
import { matchReqKey } from "../redis/key";
import { RedisMatchRequest, Location, imageOptions } from "../types/matchmakingTypes";

// Retrieve a match request from Redis hash
export async function getRedisMatchRequest(
  id: string
): Promise<RedisMatchRequest | null> {

  const data = await redis.hgetall(matchReqKey(id));
  if (!data || Object.keys(data).length === 0) return null;

  return {
    matchRequestId: data.matchRequestId,
    userId: data.userId,
    location: data.location as Location,
    startTimeMs: Number(data.startTimeMs),
    endTimeMs: Number(data.endTimeMs),
    elo: Number(data.elo),
    creditScore: Number(data.creditScore),
    profileImage: data.profileImage,
    username: data.username,
    playerCount: Number(data.playerCount) as 2 | 4,
    createdAtMs: Number(data.createdAtMs),

    avatar: data.profileImage as imageOptions,
  };
}
