import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

import { countries } from '../../mocks/data/locations';

const PB = 'http://*:8090';

const server = setupServer(
  http.get(`${PB}/api/collections/countries/records`, () =>
    HttpResponse.json({
      items: countries,
      page: 1,
      perPage: 50,
      totalItems: countries.length,
      totalPages: 1
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('+layout.server load', () => {
  it('returns countries, lang and user', async () => {
    const mod = await import('../../routes/+layout.server');
    const { createApi } = await import('../../lib/server/api');
    const api = createApi();

    const locals = { api, captureException: () => {} };
    const mockEvent = createMockServerLoadEvent({
      cookies: { get: () => 'en' },
      locals,
      route: { id: '/' },
      url: new URL('http://localhost/')
    });

    const res = (await mod.load(mockEvent as any))!;
    expect(res!).toHaveProperty('countries');
    expect(res).toHaveProperty('lang');
    expect(res).toHaveProperty('user');
    expect(res.lang).toBe('en');
  });
});
