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

describe('admin/pages/[id] — save action', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = createMockRequestEvent({ params: { id: 'page123' }, locals: {} });
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('returns 400 when title and slug are missing', async () => {
    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = await createAdminEvent({ params: { id: 'page123' } });
    const formData = new FormData();
    formData.set('title', '');
    formData.set('slug', '');
    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { method: 'POST', body: formData })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.error).toBe('Title and slug are required');
  });

  it('returns 400 when slug has invalid format', async () => {
    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = await createAdminEvent({ params: { id: 'page123' } });
    const formData = new FormData();
    formData.set('title', 'My Page');
    formData.set('slug', 'Invalid Slug!');
    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { method: 'POST', body: formData })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.error).toBe('Slug must contain only lowercase letters, numbers, and hyphens');
  });

  it('updates page and variants on success', async () => {
    server.use(
      http.patch(`${PB}/api/collections/pages/records/:id`, async ({ request }) => {
        await request.json(); // consume body to satisfy PB SDK
        return HttpResponse.json({ id: 'page123' });
      }),
      http.patch(`${PB}/api/collections/pageVariants/records/:id`, async ({ request }) => {
        await request.json(); // consume body to satisfy PB SDK
        return HttpResponse.json({ id: 'variant456' });
      })
    );

    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = await createAdminEvent({ params: { id: 'page123' } });
    const formData = new FormData();
    formData.set('title', 'My Page');
    formData.set('slug', 'my-page');
    formData.set('description', 'A test page');
    formData.set('content', '<p>Hello</p>');
    formData.set('imageAlt', 'Alt text');
    formData.set('imageCaption', 'Caption');
    formData.set(
      'variants',
      JSON.stringify([
        { language: 'es', title: 'Mi Página', description: '', content: '', imageAlt: '', imageCaption: '', id: 'v1' }
      ])
    );

    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { method: 'POST', body: formData })
    } as never)) as any;

    expect(result).toEqual({ success: true });
  });
});

describe('admin/pages/new — save action', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/pages/new/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('creates a page and redirects on success', async () => {
    server.use(
      http.post(`${PB}/api/collections/pages/records`, async ({ request }) => {
        const body = await request.clone().json();
        return HttpResponse.json({ id: 'newPage123', ...(body as object) });
      }),
      http.post(`${PB}/api/collections/pageVariants/records`, () => HttpResponse.json({ id: 'newVariant' }))
    );

    const mod = await import('../../../routes/admin/pages/new/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('title', 'New Page');
    formData.set('slug', 'new-page');

    await expect(
      mod.actions.save({
        ...event,
        request: new Request('http://localhost', { method: 'POST', body: formData })
      } as never)
    ).rejects.toThrow(); // redirect (303)
  });

  it('returns 400 on validation failure', async () => {
    const mod = await import('../../../routes/admin/pages/new/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('title', '');
    formData.set('slug', '');

    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { method: 'POST', body: formData })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.error).toBe('Title and slug are required');
  });
});
