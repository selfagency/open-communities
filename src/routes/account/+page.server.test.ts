import { vi } from 'vitest';

vi.mock('$lib/server/api', () => ({
  withRetry: (fn: () => unknown) => fn()
}));

function makeEvent(userId?: string) {
  return {
    locals: {
      api: {
        authStore: { record: userId ? { id: userId } : null },
        collection: () => ({
          getFullList: async () => [],
          getFirstListItem: async () => null
        })
      }
    },
    url: new URL('http://localhost/account'),
    params: {},
    request: new Request('http://localhost/account'),
    cookies: {
      get: () => '',
      set: () => {
        /* mock */
      },
      delete: () => {
        /* mock */
      },
      serialize: () => ''
    },
    getClientAddress: () => '127.0.0.1',
    isDataRequest: false,
    route: { id: '/account' }
  };
}

describe('account/+page.server.ts load', () => {
  it('redirects when no auth user', async () => {
    const mod = await import('./+page.server');
    await expect(mod.load(makeEvent() as never)).rejects.toMatchObject({ status: 303 });
  });

  it('returns user + congregations when authed', async () => {
    const mod = await import('./+page.server');
    const data = await mod.load(makeEvent('user123') as never);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('congregations');
  });

  it('returns empty congregations when pb returns empty list', async () => {
    const mod = await import('./+page.server');
    const data = await mod.load(makeEvent('user123') as never);
    expect(data.congregations).toEqual([]);
  });

  it('handles pb getList rejection gracefully', async () => {
    const event = makeEvent('user123');
    event.locals.api.collection = () => ({
      getFullList: () => Promise.reject(new Error('network'))
    });
    const mod = await import('./+page.server');
    await expect(mod.load(event as never)).rejects.toBeDefined();
  });
});
