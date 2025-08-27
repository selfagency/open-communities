import { describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

function makeApiStub() {
  return {
    authStore: { record: { id: 'u1', lang: 'en' } },
    collection: () => ({
      getFullList: async () => [{ id: 'c1', name: 'X' }]
    })
  };
}

const cookies = { get: () => 'en' };

describe('+layout.server load', () => {
  it('returns countries, lang and user', async () => {
    const mod = await import('../../routes/+layout.server');
    const locals = { api: makeApiStub() } as unknown;
    const mockEvent = createMockServerLoadEvent({
      cookies,
      locals,
      route: { id: '/' },
      url: new URL('http://localhost/')
    });

    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('countries');
    expect(res).toHaveProperty('lang');
    expect(res).toHaveProperty('user');
    expect(res.lang).toBe('en');
  });
});
