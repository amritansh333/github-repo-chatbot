/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per IP. Resets on server restart (acceptable for MVP).
 * For production at scale, replace with Redis-backed limiter.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 60_000) store.delete(key);
    }
  }, 5 * 60_000);
}

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 20, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now - entry.windowStart > options.windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetAt: now + options.windowMs,
    };
  }

  entry.count++;
  const remaining = Math.max(0, options.limit - entry.count);
  return {
    success: entry.count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: entry.windowStart + options.windowMs,
  };
}

/** Extract client identifier from request */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}
