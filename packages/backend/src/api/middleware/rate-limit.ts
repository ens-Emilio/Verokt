import { createMiddleware } from 'hono/factory';
import { redis } from '../../queues/config.js';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = options;

  return createMiddleware(async (c, next) => {
    const identifier = c.req.header('x-forwarded-for') ?? 'anonymous';
    const key = `${keyPrefix}:${identifier}`;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > maxRequests) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  });
}
