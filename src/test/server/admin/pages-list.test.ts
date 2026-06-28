import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

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

describe('admin/pages +page.server — load', () => {
  it('returns pages list', async () => {
    server.use(
      http.get(`${PB}/api/collections/pages/records`, () =>
        HttpResponse.json({
          items: [
            { id: 'p1', title: 'Home', slug: 'home', description: 'Home page', updated: '2024-01-01' },
            { id: 'p2', title: 'About', slug: 'about', description: 'About us', updated: '2024-02-01' }
          ],
          page: 1,
          perPage: 50,
          totalItems: 2,
          totalPages: 1
        })
      )
    );

    const mod = await import('../../../routes/admin/pages/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/pages') });
    const result = (await mod.load(event as never)) as any;
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toMatchObject({ id: 'p1', title: 'Home', slug: 'home' });
    expect(result.totalPages).toBe(1);
  });

  it('respects page parameter', async () => {
    server.use(
      http.get(`${PB}/api/collections/pages/records`, ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page');
        return HttpResponse.json({
          items: [],
          page: Number(page),
          perPage: 50,
          totalItems: 0,
          totalPages: 1
        });
      })
    );

    const mod = await import('../../../routes/admin/pages/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/pages?page=2') });
    const result = (await mod.load(event as never)) as any;
    expect(result.pages).toEqual([]);
  });
});

describe('admin/users +page.server — load', () => {
  it('returns user list without search', async () => {
    server.use(
      http.get(`${PB}/api/collections/users/records`, () =>
        HttpResponse.json({
          items: [
            {
              id: 'u1',
              name: 'Alice',
              email: 'alice@test.com',
              admin: true,
              verified: true,
              congregation: 'c1',
              expand: { congregation: { name: 'Test Cong' } }
            },
            { id: 'u2', name: 'Bob', email: 'bob@test.com', admin: false, verified: false, congregation: '' }
          ],
          page: 1,
          perPage: 18,
          totalItems: 2,
          totalPages: 1
        })
      )
    );

    const mod = await import('../../../routes/admin/users/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/users') });
    const result = (await mod.load(event as never)) as any;
    expect(result.users).toHaveLength(2);
    expect(result.users[0].name).toBe('Alice');
    expect(result.users[0].congregationName).toBe('Test Cong');
    expect(result.users[1].name).toBe('Bob');
    expect(result.total).toBe(2);
  });

  it('filters by search query', async () => {
    server.use(
      http.get(`${PB}/api/collections/users/records`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') ?? '';
        return HttpResponse.json({
          items: filter.includes('Alice')
            ? [{ id: 'u1', name: 'Alice', email: 'alice@test.com', verified: true, admin: false, congregation: '' }]
            : [],
          page: 1,
          perPage: 18,
          totalItems: filter.includes('Alice') ? 1 : 0,
          totalPages: 1
        });
      })
    );

    const mod = await import('../../../routes/admin/users/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/users?q=Alice') });
    const result = (await mod.load(event as never)) as any;
    expect(result.users).toHaveLength(1);
    expect(result.users[0].name).toBe('Alice');
    expect(result.search).toBe('Alice');
  });

  it('returns empty list for no matches', async () => {
    server.use(
      http.get(`${PB}/api/collections/users/records`, () =>
        HttpResponse.json({ items: [], page: 1, perPage: 18, totalItems: 0, totalPages: 1 })
      )
    );

    const mod = await import('../../../routes/admin/users/+page.server');
    const locals = await createAdminLocals();
    const event = createMockServerLoadEvent({ locals, url: new URL('http://localhost/admin/users?q=NoMatch') });
    const result = (await mod.load(event as never)) as any;
    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
  });
});
