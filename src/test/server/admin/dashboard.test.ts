import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

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
  return { api, captureException: () => undefined, cookieOpts: {}, validate: async () => ({}) };
}

describe('admin +page.server — load', () => {
  beforeEach(() => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') ?? '';
        if (filter.includes('true')) {
          return HttpResponse.json({ items: [], page: 1, perPage: 1, totalItems: 42, totalPages: 1 });
        }
        return HttpResponse.json({ items: [], page: 1, perPage: 1, totalItems: 5, totalPages: 1 });
      }),
      http.get(`${PB}/api/collections/users/records`, () =>
        HttpResponse.json({ items: [], page: 1, perPage: 1, totalItems: 100, totalPages: 1 })
      )
    );
  });

  it('returns stats with counts', async () => {
    const mod = await import('../../../routes/admin/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin') });
    const result = (await mod.load(event as never)) as any;
    expect(result).toEqual({
      stats: { congregations: 42, users: 100, pendingApprovals: 5 }
    });
  });
});

describe('admin/congregations +page.server — load', () => {
  beforeEach(() => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') ?? '';
        if (filter.includes('true')) {
          return HttpResponse.json({
            items: [
              {
                id: 'c1',
                name: 'Test Cong',
                denomination: 'Reform',
                visible: true,
                created: '2024-01-01',
                expand: {
                  city: { name: 'Los Angeles' },
                  state: { name: 'California' },
                  'state.country': { code: 'US' }
                }
              }
            ]
          });
        }
        return HttpResponse.json({
          items: [
            {
              id: 'c2',
              name: 'Pending Cong',
              denomination: 'Conservative',
              visible: false,
              created: '2024-06-01',
              expand: {}
            }
          ]
        });
      })
    );
  });

  it('returns congregations list', async () => {
    const mod = await import('../../../routes/admin/congregations/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/congregations') });
    const result = (await mod.load(event as never)) as any;
    expect(result.congregations).toHaveLength(2);
    expect(result.congregations[0].name).toBe('Test Cong');
    expect(result.congregations[0].city).toBe('Los Angeles');
    expect(result.congregations[1].name).toBe('Pending Cong');
    expect(result).toHaveProperty('pending');
    expect(result.pending).toHaveLength(1);
  });
});
