/* region imports */
import type { Cookies } from '@sveltejs/kit';

import { error } from '@sveltejs/kit';
import cookie from 'cookie';

import PocketBase from 'pocketbase';
import { omit } from 'radashi';
import { z } from 'zod/v4';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { TypedPocketBase } from '$lib/pocketbase.d';

import { log } from './logger';
/* endregion imports */

/**
 * Create a fresh PocketBase instance for a single request.
 * Each request gets its own instance to prevent race conditions on
 * `beforeSend` and `authStore` mutations (see P-11 in CODE_REVIEW.md).
 */
export function createApi(): TypedPocketBase {
  const instance = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
  instance.autoCancellation(false);
  return instance;
}

// Base singleton
// helper (test-only). Production code should use createApi() per request.
const api = new PocketBase(env.PUBLIC_API_ENDPOINT) as TypedPocketBase;
api.autoCancellation(false);

function cleanResponse<T extends Record<string, unknown>>(response: T, keepDate = false): Partial<T> {
  const fields: (keyof T)[] = ['collectionId' as keyof T, 'collectionName' as keyof T, 'updated' as keyof T];
  if (!keepDate) {
    fields.push('created' as keyof T);
  }
  // Strip prototype pollution keys (moved from removed convertBooleans)
  return omit(response, [...fields, '__proto__' as keyof T, 'constructor' as keyof T]) as Partial<T>;
}

function expand<T extends Record<string, unknown>>(item: T): Omit<T, 'expand'> {
  const { expand: _expand, ...rest } = item;
  return { ...rest, ...(_expand ?? {}) } as Omit<T, 'expand'>; // NOSONAR — TypeScript requires fallback for spread
}

// Type guard for PocketBase-like errors without depending on the runtime class
// (vitest's pre-bundling doesn't re-export ClientResponseError as a value).
function isPbError(err: unknown): err is { message: string; status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err &&
    typeof (err as unknown as Record<string, unknown>).status === 'number'
  );
}

/* region retry */
// HTTP status codes that indicate a transient connection issue — safe to retry
// Status 0 (connection refused / network error) is excluded: if PocketBase is
// unreachable, retrying 4 times causes 30+ seconds of blocking SSR. The
// layout/page load functions already have graceful fallbacks for this case.
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504, 520, 524]);

/** Random jitter (0–1000ms) for retry backoff to avoid thundering herd. */
function jitter(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % 1001;
}

// ~3s total window: 500+1000+2000 + jitter ≈ 4-5s — enough for a local PB restart
// without blocking SSR for 30+ seconds. Load functions already have graceful
// fallbacks (return empty arrays) when PB is unreachable.
const RETRY_DEFAULTS = {
  maxRetries: 2,
  baseDelayMs: 500,
  maxDelayMs: 4000
};

/**
 * Wrap a PocketBase API call with exponential backoff retry for transient
 * connection-level errors (cold start timeout, rate limiting, CF errors).
 * Returns the result of `fn` on success, or throws after exhausting retries.
 */
async function withRetry<T>(fn: () => Promise<T>, options?: Partial<typeof RETRY_DEFAULTS>): Promise<T> {
  const config = { ...RETRY_DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // Throw immediately on non-retryable errors (e.g., 404, 403)
      if (!isRetryable(err)) {
        throw err;
      }
      if (attempt >= config.maxRetries) {
        lastError = err;
        break;
      }
      const delay = Math.min(config.baseDelayMs * 2 ** attempt + jitter(), config.maxDelayMs);
      log.warn(`PB retry ${attempt + 1}/${config.maxRetries} after ${Math.round(delay)}ms`, err);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

function isRetryable(err: unknown): boolean {
  return isPbError(err) && RETRYABLE_STATUSES.has(err.status);
}
/* endregion retry */

// Zod schema for auth cookie model validation (S-10 fix)
const userCookieSchema = z.object({
  id: z.string(),
  email: z.string(),
  admin: z.boolean().optional(),
  verified: z.boolean().optional(),
  lang: z.string().optional(),
  congregation: z.string().optional(),
  notifications: z.boolean().optional(),
  name: z.string().optional()
});

function loadUser(cookies: Cookies): null | (z.infer<typeof userCookieSchema> & { email: string; id: string }) {
  const auth = cookies.get('auth');
  if (!auth) {
    return null;
  }
  try {
    const parsed = cookie.parseCookie(auth);
    if (!parsed.pb_auth) {
      return null;
    }
    const decoded = JSON.parse(parsed.pb_auth);
    const model = decoded?.model;
    const result = userCookieSchema.safeParse(model);
    if (!result.success) {
      return null;
    }
    return result.data as z.infer<typeof userCookieSchema> & { email: string; id: string };
  } catch {
    return null;
  }
}

/**
 * Convert an unknown error into a standardized HTTP error and throw it.
 * In production, calls SvelteKit's `error()` which always throws (never returns).
 * In tests (where `error()` is mocked to return), returns the error shape.
 */
function throwAsHttpError(err: unknown): { message: string; status: number } {
  // Re-throw 303 redirects from PB (expected during auth flows)
  if (isPbError(err) && err.status === 303) {
    throw err;
  }

  const status = isPbError(err) && err.status ? err.status : 500;
  const message = isPbError(err) ? err.message : 'An unexpected error occurred.';

  // In production, don't leak raw PB error messages to the client
  const clientMessage = dev ? message : 'Request failed';

  log.error('load', err);
  return error(status, clientMessage);
}

export { cleanResponse, expand, loadUser, throwAsHttpError, withRetry };
