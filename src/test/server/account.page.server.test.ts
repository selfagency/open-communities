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
      congregation: '',
      email: 'test@example.com',
      id: 'u1',
      lang: 'en',
      name: 'Test User',
      notifications: true
    };
    const api = {
      authStore: { record: user },
      collection: () => ({
        create: async (data: Record<string, unknown>) => ({ id: 'new-id', ...data }),
        delete: async (_id: string) => true,
        getFirstListItem: async () => null,
        getFullList: async () => [],
        getOne: async (id: string) => ({ id }),
        update: async (id: string, data: Record<string, unknown>) => ({ id, ...data })
      })
    };
    const locals = { api } as any;

    const event = createMockServerLoadEvent({ locals, route: { id: '/account' } });

    const res = await mod.load(event as never);
    expect(res).toHaveProperty('form');
    expect(res).toHaveProperty('user', user);
  });
});
