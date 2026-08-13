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
    admin: true,
    collectionId: 'test',
    collectionName: 'users',
    email: 'admin@test.test',
    id: 'admin123',
    verified: true
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
            { congregation_count: 10, country_code: 'US', country_flag: '🇺🇸', country_name: 'USA', id: '1' },
            { congregation_count: 5, country_code: 'CA', country_flag: '🇨🇦', country_name: 'Canada', id: '2' }
          ]
        })
      ),
      http.get(`${PB}/api/collections/statesByQty/records`, () =>
        HttpResponse.json({
          items: [
            { congregation_count: 8, country_name: 'USA', id: '1', state_code: 'CA', state_name: 'California' },
            { congregation_count: 3, country_name: 'USA', id: '2', state_code: 'NY', state_name: 'New York' }
          ]
        })
      ),
      http.get(`${PB}/api/collections/citiesByQty/records`, () =>
        HttpResponse.json({
          items: [
            { city_name: 'Los Angeles', congregation_count: 5, id: '1', state_code: 'CA', state_name: 'California' },
            { city_name: 'San Francisco', congregation_count: 3, id: '2', state_code: 'CA', state_name: 'California' }
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
    expect(data.topCountries[0]).toEqual({ count: 10, name: 'USA' });
    expect(data.topStates).toHaveLength(2);
    expect(data.topStates[0]).toEqual({ count: 8, name: 'California' });
    expect(data.topCities).toHaveLength(2);
    expect(data.topCities[0]).toEqual({ count: 5, name: 'Los Angeles' });
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
      congregation_count: 10 - i,
      country_code: `C${i}`,
      country_flag: '',
      country_name: `Country ${i}`,
      id: String(i)
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
