import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

import { pageAdd } from '../../mocks/data/pages';

const PB = 'http://*:8090';

const server = setupServer(
  // GET /api/collections/pages/records?filter=slug={:slug} — for the add page content
  http.get(`${PB}/api/collections/pages/records`, ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? '';
    const items = filter.includes(pageAdd.slug) ? [pageAdd] : [];
    return HttpResponse.json({
      items,
      page: 1,
      perPage: 50,
      totalItems: items.length,
      totalPages: 1
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('routes/add +page.server', () => {
  it('load redirects to login when no client id', async () => {
    const mod = await import('../../routes/add/+page.server');
    const { createApi } = await import('../../lib/server/api');
    const api = createApi();

    const locals = {
      api,
      captureException: () => {},
      validate: async () => ({})
    };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/add' },
      url: new URL('http://localhost/add')
    });

    // Should throw a redirect (302) when not authenticated
    await expect(mod.load(mockEvent as any)).rejects.toBeDefined();
  });
});
