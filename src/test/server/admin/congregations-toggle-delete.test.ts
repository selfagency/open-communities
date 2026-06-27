import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockRequestEvent } from '$test/testUtils';

const PB = 'http://*:8090';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function createAdminEvent(overrides: Record<string, unknown> = {}) {
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
  return createMockRequestEvent({
    cookies: { get: () => '', set: () => undefined, serialize: () => '' },
    locals: { api, cookieOpts: {}, capture: () => undefined, captureException: () => undefined },
    ...overrides
  });
}

describe('POST /api/admin/congregations/[id]/toggle', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' }, locals: {} });
    await expect(mod.POST(event as never)).rejects.toThrow();
  });

  it('toggles from visible to hidden', async () => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records/:id`, () =>
        HttpResponse.json({ id: 'cong123', visible: true })
      ),
      http.patch(`${PB}/api/collections/congregations/records/:id`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.visible).toBe(false);
        return HttpResponse.json({ id: 'cong123', visible: false });
      })
    );

    const mod = await import('../../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = await createAdminEvent({ params: { id: 'cong123' } });
    const res = await mod.POST(event as never);
    const data = await res.json();
    expect(data).toEqual({ success: true, emailSent: false });
  });

  it('sends approval email when toggling to visible', async () => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records/:id`, () =>
        HttpResponse.json({
          id: 'cong123',
          visible: false,
          name: 'Test Cong',
          expand: { owner: { email: 'owner@test.com', name: 'Owner' } }
        })
      ),
      http.patch(`${PB}/api/collections/congregations/records/:id`, () =>
        HttpResponse.json({ id: 'cong123', visible: true })
      )
    );

    const mod = await import('../../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = await createAdminEvent({ params: { id: 'cong123' } });
    const res = await mod.POST(event as never);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('emailSent');
  });
});

describe('DELETE /api/admin/congregations/[id]', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/congregations/[id]/delete/+server');
    const event = createMockRequestEvent({ params: { id: 'cong123' }, locals: {} });
    await expect(mod.DELETE(event as never)).rejects.toThrow();
  });

  it('deletes congregation', async () => {
    let deleted = false;
    server.use(
      http.get(`${PB}/api/collections/congregations/records/:id`, () =>
        HttpResponse.json({ id: 'cong123', visible: true })
      ),
      http.delete(`${PB}/api/collections/congregations/records/:id`, () => {
        deleted = true;
        return HttpResponse.json({});
      })
    );

    const mod = await import('../../../routes/api/admin/congregations/[id]/delete/+server');
    const event = await createAdminEvent({ params: { id: 'cong123' } });
    const res = await mod.DELETE(event as never);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(deleted).toBe(true);
  });
});
