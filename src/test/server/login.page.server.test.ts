import { describe, expect, it, vi } from 'vitest';

import { createMockRequestEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('login +page.server', () => {
  it('load provides forms', async () => {
    const mod = await import('../../../src/routes/login/+page.server');

    const locals = { validate: async () => ({}) } as any;

    const res = await mod.load({ locals } as any);
    expect(res).toHaveProperty('login');
    expect(res).toHaveProperty('reset');
    expect(res).toHaveProperty('signup');
    expect(res).toHaveProperty('verify');
  });

  it('logout action clears cookies', async () => {
    const mod = await import('../../../src/routes/login/+page.server');
    const cookies = {
      delete: () => {},
      get: () => '',
      getAll: () => [{}] as { name: string; value: string }[],
      serialize: () => '',
      set: () => {}
    };

    const locals = {
      api: { authStore: { clear: () => {} } },
      cookieOpts: {}
    } as App.Locals;
    const mockActionEvent = createMockRequestEvent({
      cookies,
      locals,
      route: { id: '/login' },
      url: new URL('http://localhost/login')
    });

    const res = await mod.actions.logout(mockActionEvent as any);
    expect(res).toEqual({});
  });
});
