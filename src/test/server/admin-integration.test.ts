import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

const PB = 'http://*:8090';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * Helper: creates a mock RequestEvent with an authenticated admin PocketBase client.
 */
async function createAdminEvent(overrides: Record<string, unknown> = {}) {
  const { createApi } = await import('../../lib/server/api');
  const api = createApi();

  // Inject admin auth into the client's auth store
  (api.authStore as Record<string, unknown>).isValid = true;
  (api.authStore as Record<string, unknown>).record = {
    id: 'admin123',
    email: 'admin@test.test',
    admin: true,
    verified: true
  };
  (api.authStore as Record<string, unknown>).token = 'mock-token';

  const cookieOpts = { httpOnly: true, path: '/', sameSite: 'strict' as const, secure: false };

  return createMockRequestEvent({
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mocks
    cookies: { get: () => '', set: () => {}, serialize: () => '' },
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mocks
    locals: { api, cookieOpts, capture: () => {}, captureException: () => {} },
    ...overrides
  });
}

/**
 * P-1 fix: Admin user edit should NOT strip admin/verified status
 * when the form only sends name/email.
 */
describe('P-1: admin user edit preserves admin/verified', () => {
  it('does not change verified/admin when fields are absent', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const capturedBodies: Record<string, unknown>[] = [];

    // Mock PB update to capture request body
    server.use(
      http.patch(`${PB}/api/collections/users/records/:id`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        capturedBodies.push(body);
        return HttpResponse.json({ ...body, id: 'user123' });
      })
    );

    const formData = new FormData();
    formData.set('name', 'Updated Name');
    formData.set('email', 'updated@test.com');
    // Intentionally NOT setting 'verified' or 'admin'

    const request = new Request('http://localhost/admin/users/user123?/update', {
      method: 'POST',
      body: formData
    });

    const event = await createAdminEvent({ params: { id: 'user123' }, request });
    await mod.actions.update(event as never);

    expect(capturedBodies).toHaveLength(1);
    expect(capturedBodies[0]).toHaveProperty('name', 'Updated Name');
    expect(capturedBodies[0]).toHaveProperty('email', 'updated@test.com');
    // These should NOT be present when not in form data
    expect(capturedBodies[0]).not.toHaveProperty('verified');
    expect(capturedBodies[0]).not.toHaveProperty('admin');
  });

  it('sets verified and admin when present in form data', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');
    const capturedBodies: Record<string, unknown>[] = [];

    server.use(
      http.patch(`${PB}/api/collections/users/records/:id`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        capturedBodies.push(body);
        return HttpResponse.json({ ...body, id: 'user123' });
      })
    );

    const formData = new FormData();
    formData.set('name', 'Updated Name');
    formData.set('email', 'updated@test.com');
    formData.set('verified', 'true');
    formData.set('admin', 'true');

    const request = new Request('http://localhost/admin/users/user123?/update', {
      method: 'POST',
      body: formData
    });

    const event = await createAdminEvent({ params: { id: 'user123' }, request });
    await mod.actions.update(event as never);

    expect(capturedBodies).toHaveLength(1);
    expect(capturedBodies[0]).toHaveProperty('verified', true);
    expect(capturedBodies[0]).toHaveProperty('admin', true);
  });
});

/**
 * S-9 fix: Last admin demotion is blocked.
 */
describe('S-9: last admin demotion guard', () => {
  it('returns fail when demoting the last admin', async () => {
    const mod = await import('../../routes/admin/users/[id]/+page.server');

    // Mock admin count query to return only 1 admin
    server.use(
      http.get(`${PB}/api/collections/users/records`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('filter')?.includes('admin')) {
          return HttpResponse.json({
            items: [{ id: 'admin123', email: 'admin@test.test', admin: true }],
            page: 1,
            perPage: 1,
            totalItems: 1,
            totalPages: 1
          });
        }
        return HttpResponse.json({ items: [], page: 1, perPage: 50, totalItems: 0, totalPages: 1 });
      }),
      // Allow any PATCH to succeed (won't be reached if guard fires)
      http.patch(`${PB}/api/collections/users/records/:id`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...body, id: 'user123' });
      })
    );

    const formData = new FormData();
    formData.set('name', 'Target User');
    formData.set('email', 'target@test.com');
    formData.set('admin', 'false');

    const request = new Request('http://localhost/admin/users/user123?/update', {
      method: 'POST',
      body: formData
    });

    const event = await createAdminEvent({ params: { id: 'user123' }, request });
    const result = await mod.actions.update(event as never);
    expect(result).toHaveProperty('error');
  });
});

/**
 * Translations save uses parallel PocketBase calls (P-4).
 */
describe('P-4: translations parallel save', () => {
  it('save action errors without auth (sanity)', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('save action processes entries', async () => {
    const mod = await import('../../routes/admin/translations/+page.server');
    let callCount = 0;

    server.use(
      http.post(`${PB}/api/collections/translations/records`, () => {
        callCount++;
        return HttpResponse.json({ id: `new-${callCount}` });
      }),
      http.patch(`${PB}/api/collections/translations/records/:id`, () => {
        callCount++;
        return HttpResponse.json({ id: 'existing-1' });
      })
    );

    const formData = new FormData();
    formData.set('key', 'test.key');
    formData.set(
      'entries',
      JSON.stringify([
        { locale: 'en', value: 'Hello' },
        { locale: 'es', value: 'Hola', id: 'existing-1' },
        { locale: 'fr', value: 'Bonjour' }
      ])
    );

    const request = new Request('http://localhost/admin/translations?/save', {
      method: 'POST',
      body: formData
    });

    const event = await createAdminEvent({ request });
    const result = await mod.actions.save(event as never);
    expect(result).toHaveProperty('success', true);
  });
});

/**
 * Page save with image upload (P-2 fix).
 */
describe('P-2: page save with image', () => {
  it('save action errors without auth (sanity)', async () => {
    const mod = await import('../../routes/admin/pages/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'page123' } });
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });
});
