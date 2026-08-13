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
    admin: true,
    collectionId: 'test',
    collectionName: 'users',
    email: 'admin@test.test',
    id: 'admin123',
    verified: true
  });
  return { api, captureException: () => undefined, cookieOpts: {}, validate: async () => ({}) };
}

describe('admin +page.server — load', () => {
  beforeEach(() => {
    server.use(
      http.get(`${PB}/api/collections/congregationMeta/records`, ({ request }) => {
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
      stats: { congregations: 42, pendingApprovals: 5, users: 100 }
    });
  });
});

describe('admin/congregations +page.server — load', () => {
  beforeEach(() => {
    server.use(
      http.get(`${PB}/api/collections/congregationMeta/records`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') ?? '';
        if (filter.includes('true')) {
          return HttpResponse.json({
            items: [
              {
                created: '2024-01-01',
                denomination: 'Reform',
                id: 'c1',
                location: JSON.stringify({
                  city: { name: 'Los Angeles' },
                  country: { code: 'US' },
                  state: { name: 'California' }
                }),
                name: 'Test Cong',
                visible: true
              }
            ]
          });
        }
        return HttpResponse.json({
          items: [
            {
              created: '2024-06-01',
              denomination: 'Conservative',
              id: 'c2',
              location: '{}',
              name: 'Pending Cong',
              visible: false
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
