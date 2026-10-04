import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, { count: number; reset: number }>();

/**
 * Fixed-window limiter. Uses Upstash in production; falls back to per-instance memory in development.
 * (The memory fallback is NOT reliable on serverless: configure Upstash before going live.)
 */
export async function rateLimit(key: string, max: number, windowSeconds: number) {
  if (redis) {
    const id = `${max}:${windowSeconds}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(max, `${windowSeconds} s`),
        prefix: 'linourine',
      });
      limiters.set(id, limiter);
    }
    const { success } = await limiter.limit(key);
    return { ok: success };
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.reset < now) {
    memory.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return { ok: true };
  }
  entry.count += 1;
  return { ok: entry.count <= max };
}
