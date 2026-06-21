/**
 * Shared server-side TTL cache for PocketBase collection data.
 *
 * All caches are module-level Map singletons (one per Node process).
 * Write operations (create/update/delete) must call the matching
 * clear function so stale data is not served after mutations.
 */

/* region countries */
const _countriesCache = new Map<string, { data: unknown[]; timestamp: number }>();
const COUNTRIES_CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes — countries change rarely

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
  const cacheKey = JSON.stringify(opts);
  const cached = _congregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CONGREGATION_CACHE_TTL_MS) {
    return cached.data as T[];
  }
  const data = await api.collection('congregationMeta').getFullList(opts);
  _congregationCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/** Call after any congregation create/update/delete to ensure fresh data. */
export function clearCongregationCache(): void {
  _congregationCache.clear();
}
/* endregion congregations */
