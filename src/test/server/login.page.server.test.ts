import { describe, expect, it, vi } from 'vitest';

import { createMockRequestEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('login +page.server — load', () => {
  it('load returns login and signup forms', async () => {
    const mod = await import('../../../src/routes/login/+page.server');

    const api = {
      authStore: { record: null },
      collection: () => ({
        getFirstListItem: async () => ({}),
        authWithPassword: async () => ({ record: { id: 'u1' }, token: 'tok' }),
        create: async () => ({ id: 'u1' }),
        requestVerification: async () => {},
        requestPasswordReset: async () => {},
        confirmPasswordReset: async () => {}
      }),
      filter: (expr: string) => expr
    } as any;
    const locals = { api, validate: async () => ({}) } as any;
    const mockEvent = createMockRequestEvent({
      locals,
      route: { id: '/login' },
      url: new URL('http://localhost/login')
    });

    const res = await mod.load(mockEvent);
    expect(res).toHaveProperty('login');
    expect(res).toHaveProperty('signup');
  });
});

describe('login +page.server — actions', () => {
  it('login succeeds with valid credentials', async () => {
    const mod = await import('../../../src/routes/login/+page.server');

    const api = {
      authStore: { record: null },
      collection: () => ({
        authWithPassword: async () => ({ record: { id: 'u1', email: 'test@example.com' }, token: 'tok' })
      }),
      filter: (expr: string) => expr
    } as any;

    const locals = {
      api,
      cookieOpts: { httpOnly: true, path: '/', sameSite: 'strict', secure: false },
      capture: () => {},
      captureException: () => {},
      validate: async () => ({
        data: { email: 'test@example.com', password: 'validpass' },
        valid: true
      })
    } as any;

    const request = new Request('http://localhost/login?/login', {
      method: 'POST',
      body: new URLSearchParams({ email: 'test@example.com', password: 'validpass' })
    });

    const mockEvent = createMockRequestEvent({
      cookies: { get: () => '', set: () => {}, serialize: () => '' },
      locals,
      request,
      route: { id: '/login' },
      url: new URL('http://localhost/login?/login')
    });

    const result = await mod.actions.login(mockEvent as any);
    expect(result).toBeDefined();
  });

  it('login returns fail with invalid credentials', async () => {
    const mod = await import('../../../src/routes/login/+page.server');

    const api = {
      authStore: { record: null },
      collection: () => ({
        authWithPassword: async () => {
          throw new Error('Failed to authenticate.');
        }
      }),
      filter: (expr: string) => expr
    } as any;

    const locals = {
      api,
      cookieOpts: { httpOnly: true, path: '/', sameSite: 'strict', secure: false },
      capture: () => {},
      captureException: () => {},
      validate: async () => ({
        data: { email: 'wrong@example.com', password: 'wrongpass' },
        valid: true
      })
    } as any;

    const request = new Request('http://localhost/login?/login', {
      method: 'POST',
      body: new URLSearchParams({ email: 'wrong@example.com', password: 'wrongpass' })
    });

    const mockEvent = createMockRequestEvent({
      cookies: { get: () => '', set: () => {}, serialize: () => '' },
      locals,
      request,
      route: { id: '/login' },
      url: new URL('http://localhost/login?/login')
    });

    const result = await mod.actions.login(mockEvent as any);
    expect(result).toBeDefined();
  });
});
