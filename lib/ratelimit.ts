/**
 * Rate limiting with optional Redis support for distributed deployments
 * Falls back to in-memory storage when REDIS_URL is not available
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const requestCounts = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetAt) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// Redis client for distributed rate limiting (lazy initialization)
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const ioredis = await import('ioredis').then((m) => m.default).catch(() => null);
    if (!ioredis) return null;
    redisClient = new ioredis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    await redisClient.connect().catch(() => {
      redisClient = null;
    });
  } catch {
    redisClient = null;
  }

  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request should be rate limited
 * Uses Redis for distributed deployments when REDIS_URL is set
 */
export async function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  const redis = await getRedisClient();
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      const results = await pipeline.exec();

      const count = results?.[0]?.[1] as number ?? 1;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: now + windowMs,
      };
    } catch {
      // Fall through to in-memory on Redis error
    }
  }

  const record = requestCounts.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    requestCounts.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function formatRetryAfter(resetAt: number): number {
  return Math.ceil((resetAt - Date.now()) / 1000);
}
