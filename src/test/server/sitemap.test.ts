import { describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

/**
 * Sitemap endpoint tests.
 */
describe('sitemap endpoint', () => {
  it('returns XML response', async () => {
    const mod = await import('../../routes/sitemap.xml/+server');
    const event = createMockRequestEvent({
      url: new URL('http://localhost:5173/sitemap.xml')
    });
    const res = await mod.GET(event as never);
    expect(res).toBeDefined();
    expect(res.headers.get('content-type')).toContain('xml');
  });
});

/**
 * Account page auth guards.
 */
describe('account page auth guards', () => {
  it('load errors without auth', async () => {
    const mod = await import('../../routes/account/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.load(event as never)).rejects.toThrow();
  });

  it('update action errors without auth', async () => {
    const mod = await import('../../routes/account/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.update(event as never)).rejects.toThrow();
  });

  it('unlink action errors without auth', async () => {
    const mod = await import('../../routes/account/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.unlink(event as never)).rejects.toThrow();
  });

  it('deleteAccount action errors without auth', async () => {
    const mod = await import('../../routes/account/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.deleteAccount(event as never)).rejects.toThrow();
  });
});
