import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

import { pageAbout } from '../../mocks/data/pages';

const PB = 'http://*:8090';

const server = setupServer(
  http.get(`${PB}/api/collections/pages/records`, () =>
    HttpResponse.json({
      items: [pageAbout],
      page: 1,
      perPage: 1,
      totalItems: 1,
      totalPages: 1
    })
  ),
  http.get(`${PB}/api/collections/pageVariants/records`, () =>
    HttpResponse.json({
      items: [],
      page: 1,
      perPage: 50,
      totalItems: 0,
      totalPages: 1
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('[slug] +page.server', () => {
  it('load returns page for valid slug', async () => {
    const mod = await import('../../../src/routes/[slug]/+page.server');
    const { createApi } = await import('../../lib/server/api');
    const api = createApi();

    const mockEvent = createMockServerLoadEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {} },
      params: { slug: 'about' },
      route: { id: '/[slug]' },
      url: new URL('http://localhost/about')
    });

    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('page');
    expect(res).toHaveProperty('variant');
  });

  it('load throws 404 for non-existent slug', async () => {
    server.use(
      http.get(`${PB}/api/collections/pages/records`, () =>
        HttpResponse.json({ code: 404, data: {}, message: 'Not found.' }, { status: 404 })
      )
    );
    const mod = await import('../../../src/routes/[slug]/+page.server');
    const { createApi } = await import('../../lib/server/api');
    const api = createApi();

    const mockEvent = createMockServerLoadEvent({
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      locals: { api, captureException: () => {} },
      params: { slug: 'nonexistent' },
      route: { id: '/[slug]' },
      url: new URL('http://localhost/nonexistent')
    });

    await expect(mod.load(mockEvent as any)).rejects.toThrow();
  });
});
