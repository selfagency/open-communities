// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearCongregationCache,
  clearCountriesCache,
  getCachedCongregations,
  getCachedCountries
} from '$lib/server/cache';

function makeApi(data: unknown[]) {
  const getFullList = vi.fn().mockResolvedValue(data);
  return {
    collection: () => ({ getFullList })
  };
}

describe('getCachedCountries', () => {
  beforeEach(() => {
    clearCountriesCache();
    vi.useFakeTimers();
  });

  it('fetches and caches countries', async () => {
    const api = makeApi([{ id: 'c1', name: 'USA' }]);
    const data = await getCachedCountries<{ id: string; name: string }>(api, { sort: 'name' });
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('USA');
  });

  it('returns cached data within TTL', async () => {
    const api = makeApi([{ id: 'c1', name: 'USA' }]);
    await getCachedCountries(api, { sort: 'name' });
    await getCachedCountries(api, { sort: 'name' });
    expect(api.collection('countries').getFullList).toHaveBeenCalledTimes(1);
  });

  it('fetches after clear', async () => {
    const api = makeApi([{ id: 'c1', name: 'USA' }]);
    await getCachedCountries(api, { sort: 'name' });
    clearCountriesCache();
    await getCachedCountries(api, { sort: 'name' });
    expect(api.collection('countries').getFullList).toHaveBeenCalledTimes(2);
  });
});

describe('getCachedCongregations', () => {
  beforeEach(() => {
    clearCountriesCache();
    clearCongregationCache();
    vi.useFakeTimers();
  });

  it('fetches and caches congregationMeta', async () => {
    const api = makeApi([{ id: 'cong1', name: 'Test Cong' }]);
    const data = await getCachedCongregations<{ id: string; name: string }>(api, { sort: '-created' });
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Test Cong');
  });

  it('clears congregation cache independently', async () => {
    const api = makeApi([{ id: 'c1', name: 'USA' }]);
    await getCachedCountries(api, { sort: 'name' });
    clearCongregationCache(); // should not affect country cache
    await getCachedCountries(api, { sort: 'name' });
    expect(api.collection('countries').getFullList).toHaveBeenCalledTimes(1); // still cached
  });
});
