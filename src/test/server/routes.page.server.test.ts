import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

import { congregationMetaViews } from '../../mocks/data/congregations';

const PB = 'http://*:8090';

const server = setupServer(
  http.get(`${PB}/api/collections/congregationMeta/records`, () =>
    HttpResponse.json({
      items: congregationMetaViews,
      page: 1,
      perPage: 50,
      totalItems: congregationMetaViews.length,
      totalPages: 1
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('routes +page.server quick smoke', () => {
  it('root load returns congregations', async () => {
    const mod = await import('../../routes/+page.server');
    const { createApi } = await import('../../lib/server/api');
    const api = createApi();

    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    const locals = { api, captureException: () => {} };
    const mockEvent = createMockServerLoadEvent({
      locals,
      route: { id: '/' },
      url: new URL('http://localhost/')
    });

    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('congregations');
  });
});
