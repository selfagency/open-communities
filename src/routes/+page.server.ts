/* region imports */
import { isFunction } from 'radashi';

import { cleanResponse, throwAsHttpError } from '$lib/server/api';
/* endregion imports */

// Short TTL cache for congregation data — changes more frequently than countries
const congregationCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CONGREGATION_CACHE_TTL_MS = 30_000; // 30 seconds

export async function load({ fetch, locals }) {
  const { api, captureException } = locals;
  const client = api?.authStore?.record;

  try {
    return {
      congregations: (
        await getCachedCongregations(api, {
          fetch,
          filter: client?.admin ? '' : 'visible=1'
        })
      ).map((c) => cleanResponse(c as Record<string, unknown>))
    };
  } catch (err) {
    if (isFunction(captureException)) {
      await captureException(err, client?.id);
    }
    throwAsHttpError(err as Error);
  }
}

async function getCachedCongregations<T>(
  api: {
    collection: (name: string) => {
      getFullList: (opts?: object) => Promise<T[]>;
    };
  },
  opts: object
): Promise<T[]> {
  const cacheKey = JSON.stringify(opts);
  const cached = congregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CONGREGATION_CACHE_TTL_MS) {
    return cached.data as T[];
  }
  const data = await api.collection('congregationMeta').getFullList(opts);
  congregationCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
