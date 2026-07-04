import { error, json } from '@sveltejs/kit';
import { getWeeklyDigest } from '$lib/server/posthog-api';
import type { RequestHandler } from './$types';

const CACHE_TTL_MS = 120_000; // 2 minutes
interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();

function getCached(key: string, ttl: number): unknown {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
  // Prune stale entries
  for (const [k, v] of cache) {
    if (Date.now() - v.timestamp > CACHE_TTL_MS * 2) {
      cache.delete(k);
    }
  }
}

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const cached = getCached('analytics', CACHE_TTL_MS);
  if (cached) {
    return json(cached);
  }

  const [monthDigest, realtimeDigest, weekDigest] = await Promise.all([
    getWeeklyDigest(30).catch(() => null),
    getWeeklyDigest(1).catch(() => null),
    getWeeklyDigest(7).catch(() => null)
  ]);

  const data = { monthDigest, realtimeDigest, weekDigest };
  setCache('analytics', data);

  return json(data);
};
