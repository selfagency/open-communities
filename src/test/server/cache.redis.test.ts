// @ts-nocheck
// Tests for the Redis/Dragonfly shared cache layer in src/lib/server/cache.ts.
// The in-memory fast path is covered in cache.test.ts; this file exercises the
// Redis read/write/clear path with a mocked ioredis client.
//
// NOTE: cache.test.ts runs in the same worker and imports cache.ts first with
// the default env (no REDIS_URL). To avoid module-cache ordering issues, this
// file resets modules and re-imports cache.ts inside beforeEach (see #543).

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $env/dynamic/private so getRedis() sees REDIS_URL regardless of the
// module-cache state left by cache.test.ts.
vi.mock('$env/dynamic/private', () => ({
  env: { REDIS_URL: 'redis://localhost:6379' }
}));

// vi.hoisted: the mock factory below is hoisted above this module's const
// declarations, so the shared mock object must be created via vi.hoisted.
const { redisMock } = vi.hoisted(() => ({
  redisMock: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    scan: vi.fn(),
    on: vi.fn(),
    quit: vi.fn()
  }
}));

vi.mock('ioredis', () => {
  class MockRedis {
    constructor() {
      Object.assign(this, redisMock);
    }
  }
  return { Redis: MockRedis };
});

function makeApi(data: unknown[]) {
  const getFullList = vi.fn().mockResolvedValue(data);
  return {
    collection: () => ({ getFullList })
  };
}

describe('getCachedCongregations with Redis', () => {
  let cache: typeof import('$lib/server/cache');

  beforeEach(async () => {
    vi.clearAllMocks();
    redisMock.get.mockReset();
    redisMock.set.mockReset();
    redisMock.del.mockReset();
    redisMock.scan.mockReset();
    redisMock.on.mockReset();
    // Reload the module under test so the $env mock applies fresh.
    vi.resetModules();
    cache = await import('$lib/server/cache');
  });

  it('writes fetched data to Redis with TTL', async () => {
    const api = makeApi([{ id: 'cong1', name: 'Test Cong' }]);
    redisMock.get.mockResolvedValue(null);

    await cache.getCachedCongregations(api, { filter: 'visible=1' });

    expect(api.collection('congregationMeta').getFullList).toHaveBeenCalledTimes(1);
    expect(redisMock.set).toHaveBeenCalledWith(
      expect.stringContaining('congregations:'),
      JSON.stringify([{ id: 'cong1', name: 'Test Cong' }]),
      'PX',
      30_000
    );
  });

  it('serves data from Redis without hitting PocketBase', async () => {
    const api = makeApi([{ id: 'cong1', name: 'Test Cong' }]);
    redisMock.get.mockResolvedValue(JSON.stringify([{ id: 'cong1', name: 'Test Cong' }]));

    const data = await cache.getCachedCongregations(api, { filter: 'visible=1' });

    expect(data).toHaveLength(1);
    expect(api.collection('congregationMeta').getFullList).not.toHaveBeenCalled();
  });

  it('falls back to PocketBase when Redis read fails', async () => {
    const api = makeApi([{ id: 'cong1', name: 'Test Cong' }]);
    redisMock.get.mockRejectedValue(new Error('connection refused'));

    const data = await cache.getCachedCongregations(api, { filter: 'visible=1' });

    expect(data).toHaveLength(1);
    expect(api.collection('congregationMeta').getFullList).toHaveBeenCalledTimes(1);
  });

  it('clears Redis keys matching the congregation pattern on clear', async () => {
    const api = makeApi([{ id: 'cong1', name: 'Test Cong' }]);
    redisMock.get.mockResolvedValue(null);
    redisMock.scan.mockResolvedValueOnce(['0', ['congregations:{"filter":"visible=1"}']]);

    await cache.getCachedCongregations(api, { filter: 'visible=1' });
    cache.clearCongregationCache();

    // scan + del are fire-and-forget; give the microtask queue a tick
    await new Promise((r) => setTimeout(r, 0));
    expect(redisMock.scan).toHaveBeenCalledWith('0', 'MATCH', 'congregations:*', 'COUNT', 100);
    expect(redisMock.del).toHaveBeenCalledWith('congregations:{"filter":"visible=1"}');
  });
});
