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
