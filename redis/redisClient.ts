import Redis from "ioredis";

export const redis =
  process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL) // Production / Hosted Redis
    : new Redis({
        host: process.env.REDIS_HOST,  // Local Redis
        port: Number(process.env.REDIS_PORT),
      });