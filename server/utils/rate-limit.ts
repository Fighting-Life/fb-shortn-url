import type { H3Event } from "h3";
import { useRedis } from "./redis";

export async function checkClickRateLimit(
  event: H3Event,
  ip: string,
  limit = 30,        // max 30 klik
  windowSec = 60,    // per 60 detik
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:click:${ip}`;
  const redis = useRedis(event);

  const current = (await redis.getCache<number>(key)) ?? 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await redis.setCache(key, current + 1, windowSec);
  return { allowed: true, remaining: limit - current - 1 };
}
