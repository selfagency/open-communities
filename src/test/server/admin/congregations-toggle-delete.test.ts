import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

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

describe('POST /api/admin/congregations/[id]/toggle', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/congregations/[id]/toggle/+server');
    const event = { locals: { api: { authStore: { record: null } } }, params: { id: 'cong123' } };
    await expect(mod.POST(event as never)).rejects.toMatchObject({ status: 401 });
  });

  it('toggles from visible to hidden', async () => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records/cong123`, () =>
        HttpResponse.json({ id: 'cong123', visible: true })
      ),
      http.patch(`${PB}/api/collections/congregations/records/cong123`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'cong123', visible: body.visible });
      })
    );

    const mod = await import('../../../routes/api/admin/congregations/[id]/toggle/+server');
    const locals = await createAdminLocals();
    const res = await mod.POST({ locals, params: { id: 'cong123' } } as never);
    const data = await res.json();
    expect(data).toMatchObject({ emailSent: false, success: true });
  });
});

describe('DELETE /api/admin/congregations/[id]/delete', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/api/admin/congregations/[id]/delete/+server');
    const event = { locals: { api: { authStore: { record: null } } }, params: { id: 'cong123' } };
    await expect(mod.DELETE(event as never)).rejects.toMatchObject({ status: 401 });
  });

  it('deletes congregation and returns success', async () => {
    server.use(
      http.get(`${PB}/api/collections/congregations/records/cong123`, () =>
        HttpResponse.json({ expand: { owner: null }, id: 'cong123', name: 'Test' })
      ),
      http.delete(`${PB}/api/collections/congregations/records/cong123`, () => HttpResponse.json({}))
    );

    const mod = await import('../../../routes/api/admin/congregations/[id]/delete/+server');
    const locals = await createAdminLocals();
    const res = await mod.DELETE({ locals, params: { id: 'cong123' } } as never);
    const data = await res.json();
    expect(data).toMatchObject({ success: true });
  });
});
