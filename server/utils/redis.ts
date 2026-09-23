import type { Redis } from "@upstash/redis";
import type { H3Event } from "h3";

export const useRedis = (event: H3Event) => {
  let redis = event.context.redis as Redis | null;

  async function setRedis(client: Redis) {
    if (!redis) {
      redis = client;
    }
  }

  async function setCache<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    if (!redis) return;

    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
  }

  async function getCache<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    const cachedData = await redis.get<T>(key);
    return cachedData ?? null;
  }

  async function deleteCache(key: string): Promise<void> {
    if (!redis) return;
    await redis.del(key);
  }

  return {
    redis,
    setRedis,
    setCache,
    getCache,
    deleteCache,
  };
};
