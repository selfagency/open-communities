import { beforeEach, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

function makeApiStub() {
  return {
    authStore: { record: {} },
    collection() {
      return {
        async getFirstListItem() {
          return { body: 'x', id: 'p1' };
        },
        async getFullList() {
          return [];
        },
        async getOne() {
          return { id: 'o1' };
        }
      } as any;
    }
  } as any;
}

describe('routes +page.server quick smoke', () => {
  let locals: any;

  beforeEach(() => {
    locals = { api: makeApiStub(), validate: async () => ({}) };
  });

  it('root load returns congregations', async () => {
    const mod = await import('../../../src/routes/+page.server');

    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/' },
      url: new URL('http://localhost/')
    });

    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('congregations');
  });
});
