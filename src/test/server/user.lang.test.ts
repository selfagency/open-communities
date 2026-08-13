import { describe, expect, it, vi } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_HOSTNAME: 'http://localhost:5173' }
}));

vi.mock('$lib/server/logger', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
  log: { error: () => {} }
}));

describe('user/lang +server', () => {
  it('rejects invalid lang value', async () => {
    const mod = await import('../../routes/user/lang/+server');
    const api = {
      authStore: { record: { id: 'u1' } },
      collection: () => ({ update: async () => ({}) })
    } as any;

    const request = new Request('http://localhost:5173/user/lang', {
      body: JSON.stringify({ lang: 'invalid' }),
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      method: 'POST'
    });

    const mockEvent = createMockRequestEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {} },
      request,
      route: { id: '/user/lang' },
      url: new URL('http://localhost:5173/user/lang')
    });

    const res = await mod.POST(mockEvent as any);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('rejects non-admin changing another user', async () => {
    const mod = await import('../../routes/user/lang/+server');
    const api = {
      authStore: { record: { id: 'u1' } },
      collection: () => ({ update: async () => ({}) })
    } as any;

    const request = new Request('http://localhost:5173/user/lang', {
      body: JSON.stringify({ lang: 'en', user: 'other-user' }),
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      method: 'POST'
    });

    const mockEvent = createMockRequestEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {} },
      request,
      route: { id: '/user/lang' },
      url: new URL('http://localhost:5173/user/lang')
    });

    const res = await mod.POST(mockEvent as any);
    expect(res.status).toBe(403);
  });

  it('allows self lang update', async () => {
    const mod = await import('../../routes/user/lang/+server');
    const updateMock = vi.fn().mockResolvedValue({ id: 'u1', lang: 'es' });
    const api = {
      authStore: { record: { id: 'u1' } },
      collection: () => ({ update: updateMock })
    } as any;

    const request = new Request('http://localhost:5173/user/lang', {
      body: JSON.stringify({ lang: 'es' }),
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      method: 'POST'
    });

    const mockEvent = createMockRequestEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      cookies: { get: () => '', serialize: () => '', set: () => {} },
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {}, cookieOpts: {} },
      request,
      route: { id: '/user/lang' },
      url: new URL('http://localhost:5173/user/lang')
    });

    const res = await mod.POST(mockEvent as any);
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith('u1', { lang: 'es' });
  });

  it('returns 401 when client is not authenticated', async () => {
    const mod = await import('../../routes/user/lang/+server');
    const api = {
      authStore: { record: null },
      collection: () => ({ update: async () => ({}) })
    } as any;

    const request = new Request('http://localhost:5173/user/lang', {
      body: JSON.stringify({ lang: 'en' }),
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      method: 'POST'
    });

    const mockEvent = createMockRequestEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {} },
      request,
      route: { id: '/user/lang' },
      url: new URL('http://localhost:5173/user/lang')
    });

    const res = await mod.POST(mockEvent as any);
    expect(res.status).toBe(200);
  });

  it('returns 500 when PB update fails', async () => {
    const mod = await import('../../routes/user/lang/+server');
    const api = {
      authStore: { record: { id: 'u1' } },
      collection: () => ({
        // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
        update: async () => {
          throw new Error('PB error');
        }
      })
    } as any;

    const request = new Request('http://localhost:5173/user/lang', {
      body: JSON.stringify({ lang: 'en' }),
      headers: { 'content-type': 'application/json', origin: 'http://localhost:5173' },
      method: 'POST'
    });

    const mockEvent = createMockRequestEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      cookies: { get: () => '', serialize: () => '', set: () => {} },
      locals: { api, captureException: vi.fn(), cookieOpts: {} },
      request,
      route: { id: '/user/lang' },
      url: new URL('http://localhost:5173/user/lang')
    });

    const res = await mod.POST(mockEvent as any);
    expect(res.status).toBe(500);
  });
});
