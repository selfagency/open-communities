import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

const PB = 'http://*:8090';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function createAdminLocals() {
  const { createApi } = await import('../../../lib/server/api');
  const api = createApi();
  api.authStore.save('mock-token', {
    id: 'admin123',
    email: 'admin@test.test',
    admin: true,
    verified: true,
    collectionId: 'test',
    collectionName: 'users'
  });
  return { api, captureException: () => undefined, cookieOpts: {} };
}

describe('GET /admin/stats', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/stats/+server');
    const event = createMockRequestEvent({ locals: {} });
    await expect(mod.GET(event as never)).rejects.toThrow();
  });

  it('returns geo stats from all views', async () => {
    server.use(
      http.get(`${PB}/api/collections/countriesByQty/records`, () =>
        HttpResponse.json({
          items: [
            { id: '1', country_name: 'USA', congregation_count: 10, country_code: 'US', country_flag: '🇺🇸' },
            { id: '2', country_name: 'Canada', congregation_count: 5, country_code: 'CA', country_flag: '🇨🇦' }
          ]
        })
      ),
      http.get(`${PB}/api/collections/statesByQty/records`, () =>
        HttpResponse.json({
          items: [
            { id: '1', state_name: 'California', congregation_count: 8, state_code: 'CA', country_name: 'USA' },
            { id: '2', state_name: 'New York', congregation_count: 3, state_code: 'NY', country_name: 'USA' }
          ]
        })
      ),
      http.get(`${PB}/api/collections/citiesByQty/records`, () =>
        HttpResponse.json({
          items: [
            { id: '1', city_name: 'Los Angeles', congregation_count: 5, state_code: 'CA', state_name: 'California' },
            { id: '2', city_name: 'San Francisco', congregation_count: 3, state_code: 'CA', state_name: 'California' }
          ]
        })
      ),
      http.get(`${PB}/api/collections/totalCountries/records`, () =>
        HttpResponse.json({ items: [{ id: '1', total_countries: 2 }] })
      ),
      http.get(`${PB}/api/collections/totalStates/records`, () =>
        HttpResponse.json({ items: [{ id: '1', total_states: 2 }] })
      ),
      http.get(`${PB}/api/collections/totalCities/records`, () =>
        HttpResponse.json({ items: [{ id: '1', total_cities: 2 }] })
      )
    );

    const mod = await import('../../../routes/admin/stats/+server');
    const locals = await createAdminLocals();
    const event = createMockRequestEvent({ locals });
    const res = await mod.GET(event as never);
    const data = await res.json();

    expect(data.topCountries).toHaveLength(2);
    expect(data.topCountries[0]).toEqual({ name: 'USA', count: 10 });
    expect(data.topStates).toHaveLength(2);
    expect(data.topStates[0]).toEqual({ name: 'California', count: 8 });
    expect(data.topCities).toHaveLength(2);
    expect(data.topCities[0]).toEqual({ name: 'Los Angeles', count: 5 });
    expect(data.totalCountries).toBe(2);
    expect(data.totalStates).toBe(2);
    expect(data.totalCities).toBe(2);
  });

  it('handles empty data from all views', async () => {
    server.use(
      http.get(`${PB}/api/collections/countriesByQty/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/statesByQty/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/citiesByQty/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalCountries/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalStates/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalCities/records`, () => HttpResponse.json({ items: [] }))
    );

    const mod = await import('../../../routes/admin/stats/+server');
    const locals = await createAdminLocals();
    const event = createMockRequestEvent({ locals });
    const res = await mod.GET(event as never);
    const data = await res.json();

    expect(data.topCountries).toEqual([]);
    expect(data.topStates).toEqual([]);
    expect(data.topCities).toEqual([]);
    expect(data.totalCountries).toBe(0);
    expect(data.totalStates).toBe(0);
    expect(data.totalCities).toBe(0);
  });

  it('top slices are capped at 5 items', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      country_name: `Country ${i}`,
      congregation_count: 10 - i,
      country_code: `C${i}`,
      country_flag: ''
    }));
    server.use(
      http.get(`${PB}/api/collections/countriesByQty/records`, () => HttpResponse.json({ items })),
      http.get(`${PB}/api/collections/statesByQty/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/citiesByQty/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalCountries/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalStates/records`, () => HttpResponse.json({ items: [] })),
      http.get(`${PB}/api/collections/totalCities/records`, () => HttpResponse.json({ items: [] }))
    );

    const mod = await import('../../../routes/admin/stats/+server');
    const locals = await createAdminLocals();
    const event = createMockRequestEvent({ locals });
    const res = await mod.GET(event as never);
    const data = await res.json();

    expect(data.topCountries).toHaveLength(5);
  });
});
