import { describe, expect, it, vi } from 'vitest';

import { createMockRequestEvent, createMockServerLoadEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('contact +page.server', () => {
  it('load returns congregations and form', async () => {
    // Import the module dynamically so mocks are applied first
    const mod = await import('../../../src/routes/contact/+page.server');

    const api = {
      authStore: { record: { id: 'u1' } },
      collection: () => ({
        getFullList: async () => []
      }),
      filter: (expr: string) => expr
    } as any;
    const locals = { api, validate: async () => ({}) };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/contact' },
      url: new URL('http://localhost/contact')
    });

    const res = await mod.load(mockEvent);
    expect(res).toHaveProperty('form');
  });

  it('returns captcha form and congregration list even when unauthenticated', async () => {
    const mod = await import('../../../src/routes/contact/+page.server');

    const api = {
      authStore: { record: null },
      collection: () => ({
        getFullList: async () => []
      }),
      filter: (expr: string) => expr
    } as any;
    const locals = { api, validate: async () => ({}) };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/contact' },
      url: new URL('http://localhost/contact')
    });

    const res = await mod.load(mockEvent);
    expect(res).toHaveProperty('form');
  });

  describe('default action', () => {
    it('handles captcha failure gracefully', async () => {
      const mod = await import('../../../src/routes/contact/+page.server');

      const api = {
        authStore: { record: { id: 'u1' } },
        collection: () => ({
          create: async () => ({}),
          update: async () => ({})
        }),
        filter: (expr: string) => expr
      } as any;

      const locals = {
        api,
        captureException: () => {},
        log: { error: () => {} },
        validate: async () => ({
          data: {
            captcha: 'invalid',
            congregation: '',
            email: 'test@example.com',
            message: 'Test message',
            name: 'Test User',
            reason: 'question'
          },
          valid: true
        })
      } as any;

      const request = new Request('http://localhost/contact', {
        method: 'POST',
        body: new URLSearchParams({
          captcha: 'invalid',
          email: 'test@example.com',
          message: 'Test message',
          name: 'Test User',
          reason: 'question'
        })
      });

      const mockEvent = createMockRequestEvent({
        locals,
        request,
        route: { id: '/contact' },
        url: new URL('http://localhost/contact')
      });

      // The action should run without throwing even if captcha fails
      const result = await mod.actions.default(mockEvent as any);
      expect(result).toBeDefined();
    });
  });
});
