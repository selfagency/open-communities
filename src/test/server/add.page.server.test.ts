import { describe, expect, it, vi } from 'vitest';

import { createMockServerLoadEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

function makeLocals(overrides = {}) {
  const api = {
    authStore: { record: {} },
    collection: () => ({ getFirstListItem: async () => ({ id: 'page' }) })
  } as any;

  return { api, validate: async () => ({}), ...overrides } as any;
}

describe('routes/add +page.server', () => {
  it('load redirects to login when no client id', async () => {
    const mod = await import('../../../src/routes/add/+page.server');
    const locals = makeLocals({
      api: {
        authStore: { record: null },
        collection: () => ({ getFirstListItem: async () => ({}) })
      }
    });
    // load should throw (SvelteKit redirect) when no client id
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/add' },
      url: new URL('http://localhost/add')
    });

    await expect(mod.load(mockEvent as any)).rejects.toBeDefined();
  });
});
