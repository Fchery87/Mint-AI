/**
 * Simple in-memory rate limiting
 * For production, use Redis or Upstash for distributed rate limiting
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

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit = 10,
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  // No previous record or window expired
  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    requestCounts.set(identifier, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try to get real IP from common headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a default (this won't work well in production)
  return "unknown";
}

/**
 * Format seconds until reset
 */
export function formatRetryAfter(resetAt: number): number {
  return Math.ceil((resetAt - Date.now()) / 1000);
}
