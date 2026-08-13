/**
 * Shared server-side TTL cache for PocketBase collection data.
 *
 * Two layers:
 * - In-memory Map (fast path, per-process)
 * - Redis/Dragonfly (shared across replicas) when REDIS_URL is configured
 *
 * Redis failures degrade gracefully to the in-memory layer — a Redis outage
 * must never break page loads (same philosophy as withRetry in api.ts).
 * Write operations (create/update/delete) must call the matching clear
 * function so stale data is not served after mutations.
 */

import { Redis } from 'ioredis';
import { env } from '$env/dynamic/private';

import { log } from '$lib/server/logger';

/* region redis */
let _redis: Redis | null = null;
let _redisFailed = false;

function getRedis(): Redis | null {
  if (_redisFailed) {
    return null;
  }
  if (_redis) {
    return _redis;
  }
  const url = env.REDIS_URL;
  if (!url) {
    return null;
  }
  try {
    _redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000
    });
    _redis.on('error', (err) => {
      // Mark failed so subsequent calls skip Redis entirely (fast fail).
      _redisFailed = true;
      log.warn('Redis cache unavailable, falling back to in-memory cache', err);
    });
    _redis.on('ready', () => {
      _redisFailed = false;
    });
    return _redis;
  } catch (err) {
    _redisFailed = true;
    log.warn('Redis cache init failed, falling back to in-memory cache', err);
    return null;
  }
}

async function redisGet(key: string): Promise<unknown[] | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  try {
    const raw = await redis.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as unknown[];
  } catch (err) {
    log.warn('Redis cache read failed, falling back to in-memory cache', err);
    return null;
  }
}

async function redisSet(key: string, data: unknown[], ttlMs: number): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  try {
    await redis.set(key, JSON.stringify(data), 'PX', ttlMs);
  } catch (err) {
    log.warn('Redis cache write failed, falling back to in-memory cache', err);
  }
}

async function redisDelPattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    log.warn('Redis cache pattern delete failed', err);
  }
}
/* endregion redis */

/* region countries */
const _countriesCache = new Map<string, { data: unknown[]; timestamp: number }>();
const COUNTRIES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — countries change rarely

export async function getCachedCountries<T>(
  api: { collection: (name: string) => { getFullList: (opts?: object) => Promise<T[]> } },
  opts?: object
): Promise<T[]> {
  const cacheKey = `countries:${JSON.stringify(opts ?? {})}`;
  const cached = _countriesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < COUNTRIES_CACHE_TTL_MS) {
    return cached.data as T[];
  }
  const data = await api.collection('countries').getFullList(opts);
  _countriesCache.set(cacheKey, { data, timestamp: Date.now() });
  // Prune stale entries
  for (const [k, v] of _countriesCache) {
    if (Date.now() - v.timestamp > COUNTRIES_CACHE_TTL_MS * 2) {
      _countriesCache.delete(k);
    }
  }
  return data;
}

export function clearCountriesCache(): void {
  _countriesCache.clear();
}
/* endregion countries */

/* region congregations */
const _congregationCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CONGREGATION_CACHE_TTL_MS = 30_000; // 30 seconds

export async function getCachedCongregations<T>(
  api: { collection: (name: string) => { getFullList: (opts?: object) => Promise<T[]> } },
  opts: object
): Promise<T[]> {
  const cacheKey = `congregations:${JSON.stringify(opts)}`;

  // Fast path: in-memory cache
  const cached = _congregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CONGREGATION_CACHE_TTL_MS) {
    return cached.data as T[];
  }

  // Shared path: Redis (skipped when unavailable)
  const redisData = await redisGet(cacheKey);
  if (redisData) {
    _congregationCache.set(cacheKey, { data: redisData, timestamp: Date.now() });
    return redisData as T[];
  }

  const data = await api.collection('congregationMeta').getFullList(opts);
  _congregationCache.set(cacheKey, { data, timestamp: Date.now() });
  await redisSet(cacheKey, data, CONGREGATION_CACHE_TTL_MS);
  // Prune stale entries
  for (const [k, v] of _congregationCache) {
    if (Date.now() - v.timestamp > CONGREGATION_CACHE_TTL_MS * 2) {
      _congregationCache.delete(k);
    }
  }
  return data;
}

/** Call after any congregation create/update/delete to ensure fresh data. */
export function clearCongregationCache(): void {
  _congregationCache.clear();
  // Best-effort: clear shared cache too. Fire-and-forget — a Redis failure
  // here only means a slightly stale shared entry, which the TTL bounds.
  redisDelPattern('congregations:*').catch(() => {
    /* fire-and-forget: Redis failure only means a slightly stale shared entry */
  });
}
/* endregion congregations */
