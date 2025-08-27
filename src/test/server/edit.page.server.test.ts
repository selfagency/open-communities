import { describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

function makeApiStub() {
  return {
    authStore: { record: { admin: false, congregation: 'c1', id: 'u1' } },
    collection: () => ({
      getFirstListItem: async () => ({ id: 'c1', location: {} }),
      getOne: async () => ({
        accessibility: { id: 'a1' },
        fit: { id: 'f1' },
        health: { id: 'h1' },
        id: 'c1',
        registration: { id: 'r1' },
        security: { id: 's1' },
        services: { id: 'sv1' }
      })
    }),
    createBatch: () => ({
      collection: () => ({ create: () => {}, delete: () => {}, update: () => {} }),
      send: async () => ({})
    })
  } as any;
}

describe('edit +page.server', () => {
  it('load returns congregation and forms when authenticated', async () => {
    const mod = await import('../../../src/routes/edit/+page.server');

    const locals = { api: makeApiStub(), validate: async () => ({}) } as any;
    const url = new URL('http://localhost/?id=c1');
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/edit' },
      url
    });

    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('congregation');
    expect(res).toHaveProperty('form');
  });
});
