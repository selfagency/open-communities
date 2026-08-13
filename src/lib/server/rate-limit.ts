import { error } from '@sveltejs/kit';

interface Bucket {
  lastRefill: number;
  tokens: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory sliding-window rate limiter.
 * Limits to `maxRequests` per `windowMs` per key (typically user ID or IP).
 * Returns `true` if allowed, throws HTTP 429 if exceeded.
 */
function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.lastRefill >= windowMs) {
    // New window — refill
    buckets.set(key, { lastRefill: now, tokens: maxRequests - 1 });
    return true;
  }

  if (bucket.tokens <= 0) {
    throw error(429, 'Too many requests — try again later');
  }

  bucket.tokens -= 1;
  return true;
}

/**
 * Rate limit by the authenticated user's ID (or by IP for unauthenticated).
 */
export function rateLimitByUser(userId: string, maxRequests = 10, windowMs = 60_000): boolean {
  return checkRateLimit(`user:${userId}`, maxRequests, windowMs);
}
