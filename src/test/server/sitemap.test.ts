import { describe, expect, it, vi } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

vi.mock('$lib/server/logger', () => ({
  log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
}));

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_API_ENDPOINT: 'http://localhost:8090' }
}));

const mockResponse = vi.fn();
vi.mock('super-sitemap', () => ({
  response: mockResponse
}));

function makeApiStub() {
  return {
    collection: (_name: string) => ({
      getFullList: vi.fn().mockImplementation((opts: Record<string, unknown>) => {
        if (opts.requestKey === 'sitemap-congs') {
          return [
            { id: 'c1', updated: '2024-01-01' },
            { id: 'c2', updated: '2024-01-02' }
          ];
        }
        if (opts.requestKey === 'sitemap-pages') {
          return [{ slug: 'about' }, { slug: 'faq' }];
        }
        return [];
      })
    })
  } as any;
}

describe('routes/sitemap.xml +server', () => {
  beforeEach(() => {
    mockResponse.mockReset();
  });

  it('returns sitemap response with congregations and pages', async () => {
    mockResponse.mockResolvedValue(
      new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://opencommunities.info/</loc></url></urlset>',
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      )
    );
    const mod = await import('../../routes/sitemap.xml/+server');
    const api = makeApiStub();
    const locals = { api };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/sitemap.xml' },
      url: new URL('http://localhost/sitemap.xml')
    });

    const response = await mod.GET(mockEvent as any);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(mockResponse).toHaveBeenCalled();
    // Verify the sitemap was called with congregation IDs and page slugs
    const callArgs = mockResponse.mock.calls[0][0];
    expect(callArgs.additionalPaths).toContain('/?id=c1');
    expect(callArgs.additionalPaths).toContain('/?id=c2');
    expect(callArgs.paramValues['/[slug]']).toHaveLength(2);
  });

  it('handles PB fetch failure gracefully', async () => {
    mockResponse.mockResolvedValue(
      new Response(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://opencommunities.info/</loc></url></urlset>',
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      )
    );
    const mod = await import('../../routes/sitemap.xml/+server');
    const api = {
      collection: () => ({
        getFullList: vi.fn().mockRejectedValue(new Error('PB down'))
      })
    } as any;
    const locals = { api };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/sitemap.xml' },
      url: new URL('http://localhost/sitemap.xml')
    });

    const response = await mod.GET(mockEvent as any);
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    // Should still call sitemap.response even when PB fails
    expect(mockResponse).toHaveBeenCalled();
    const callArgs = mockResponse.mock.calls[0][0];
    // No congregations when PB fails
    expect(callArgs.additionalPaths).not.toContain('/?id=');
  });
});
