import { describe, expect, it, vi } from 'vitest';

import { createMockServerLoadEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('account +page.server — load', () => {
  it('throws 401 when not authenticated', async () => {
    const mod = await import('../../../src/routes/account/+page.server');

    const api = {
      authStore: { record: null },
      filter: (expr: string) => expr
    };
    const locals = { api } as any;

    const event = createMockServerLoadEvent({ locals, route: { id: '/account' } });

    try {
      await mod.load(event as never);
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      const httpErr = err as { status?: number; body?: unknown };
      expect(httpErr.status).toBe(401);
    }
  });

  it('returns form and user when authenticated', async () => {
    const mod = await import('../../../src/routes/account/+page.server');

    const user = {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      lang: 'en',
      congregation: '',
      notifications: true
    };
    const api = {
      authStore: { record: user },
      collection: () => ({
        getFullList: async () => [],
        getOne: async (id: string) => ({ id }),
        getFirstListItem: async () => null,
        create: async (data: Record<string, unknown>) => ({ id: 'new-id', ...data }),
        update: async (id: string, data: Record<string, unknown>) => ({ id, ...data }),
        delete: async (_id: string) => true
      })
    };
    const locals = { api } as any;

    const event = createMockServerLoadEvent({ locals, route: { id: '/account' } });

    const res = await mod.load(event as never);
    expect(res).toHaveProperty('form');
    expect(res).toHaveProperty('user', user);
  });
});
