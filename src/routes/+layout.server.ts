/* region imports */
import { isFunction } from 'radashi';

import { cleanResponse, throwAsHttpError } from '$lib/server/api';

/* endregion imports */

// Module-level TTL cache for data that rarely changes
const cache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function load({ cookies, fetch, locals }) {
  const { api, captureException } = locals;
  const user = api?.authStore?.record;
  const lang = cookies.get('lang') || user?.lang || 'en';

  try {
    const countries = await getCachedFullList(api, 'countries', { fetch });

    return {
      countries: countries.map((c) => cleanResponse(c as Record<string, unknown>)),
      lang,
      user
    };
  } catch (err) {
    if (isFunction(captureException)) {
      await captureException(err, user?.id);
    }
    throwAsHttpError(err as Error);
  }
}

async function getCachedFullList<T>(
  api: {
    collection: (name: string) => {
      getFullList: (opts?: object) => Promise<T[]>;
    };
  },
  collectionName: string,
  opts?: object
): Promise<T[]> {
  const cacheKey = `${collectionName}:${JSON.stringify(opts ?? {})}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T[];
  }
  const data = await api.collection(collectionName).getFullList(opts);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
