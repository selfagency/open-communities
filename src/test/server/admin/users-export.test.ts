import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const PB = 'http://*:8090';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GET /admin/users/export', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/users/export/+server');
    const event = { locals: { api: { authStore: { record: null } } } };
    await expect(mod.GET(event as never)).rejects.toMatchObject({ status: 401 });
  });

  it('returns CSV with header when no users', async () => {
    server.use(
      http.get(`${PB}/api/collections/users/records`, () =>
        HttpResponse.json({ items: [], page: 1, perPage: 50, totalItems: 0 })
      )
    );

    const mod = await import('../../../routes/admin/users/export/+server');
    const locals = {
      api: {
        authStore: {
          record: { id: 'admin1', admin: true, email: 'admin@test.com' }
        },
        collection: () => ({
          getFullList: async () => []
        })
      }
    };
    const res = await mod.GET({ locals } as never);
    const text = await res.text();
    expect(text).toContain('name,email');
  });

  it('returns CSV with user data', async () => {
    server.use(
      http.get(`${PB}/api/collections/users/records`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'u1',
              name: 'Test User',
              email: 'test@example.com',
              email_opted_out: false,
              expand: {}
            }
          ],
          page: 1,
          perPage: 50,
          totalItems: 1
        })
      )
    );

    const mod = await import('../../../routes/admin/users/export/+server');
    const locals = {
      api: {
        authStore: {
          record: { id: 'admin1', admin: true, email: 'admin@test.com' }
        },
        collection: () => ({
          getFullList: async () => [
            {
              id: 'u1',
              name: 'Test User',
              email: 'test@example.com',
              congregation: null,
              expand: {}
            }
          ]
        })
      }
    };
    const res = await mod.GET({ locals } as never);
    const text = await res.text();
    expect(text).toContain('Test User');
    expect(text).toContain('test@example.com');
  });
});
