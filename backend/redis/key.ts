import { Location } from "../types/matchmakingTypes";

// Redis sorted set key for active searching requests at a location
export const activeQueueKey = (location: Location) =>
  `active:searching:${location}`;

// Redis hash key for match request
export const matchReqKey = (matchRequestId: string) =>
  `matchreq:${matchRequestId}`;

// Key to track searching TTL
export const searchingTTLKey = (matchRequestId: string) =>
  `searching:${matchRequestId}`;

// Key to lock a match request during processing
export const lockKey = (matchRequestId: string) =>
  `lock:${matchRequestId}`;

// Key for match confirmation
export const confirmKey = (matchRequestId: string) =>
  `confirm:${matchRequestId}`;

// two user ids to avoid matching each other
export const avoidMatchKey = (id1: string, id2: string) => 
  // Sort ids to ensure A vs B is the same key as B vs A
  `avoid:${[id1, id2].sort().join(":")}`;