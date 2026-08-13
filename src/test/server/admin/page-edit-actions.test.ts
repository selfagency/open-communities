import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createMockRequestEvent, mockSveltekitSuperforms } from '$test/testUtils';

// Mock sveltekit-superforms before any dynamic imports
// Use vi.fn() for superValidate to allow per-test overrides via mockResolvedValueOnce
const mockSuperValidate = vi.fn().mockReturnValue({});
vi.mock('sveltekit-superforms', () => ({
  ...mockSveltekitSuperforms,
  superValidate: mockSuperValidate
}));

// Routes import superValidate from the server subpath; mock it too.
vi.mock('sveltekit-superforms/server', () => ({
  ...mockSveltekitSuperforms,
  superValidate: mockSuperValidate
}));

const PB = 'http://*:8090';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function createAdminEvent(overrides: Record<string, unknown> = {}) {
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
  return createMockRequestEvent({
    cookies: { get: () => '', serialize: () => '', set: () => undefined },
    locals: { api, capture: () => undefined, captureException: () => undefined, cookieOpts: {} },
    ...overrides
  });
}

describe('admin/pages/[id] — save action', () => {
  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = createMockRequestEvent({ locals: {}, params: { id: 'page123' } });
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
      request: new Request('http://localhost', { body: formData, method: 'POST' })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.form).toBeDefined();
  });

  it('returns 400 when slug has invalid format', async () => {
    const mod = await import('../../../routes/admin/pages/[id]/+page.server');
    const event = await createAdminEvent({ params: { id: 'page123' } });
    const formData = new FormData();
    formData.set('title', 'My Page');
    formData.set('slug', 'Invalid Slug!');
    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { body: formData, method: 'POST' })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.form).toBeDefined();
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

    // Mock superValidate to return valid for success case
    const { superValidate } = await import('sveltekit-superforms');
    (superValidate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        content: '<p>Hello</p>',
        description: 'A test page',
        imageAlt: 'Alt text',
        imageCaption: 'Caption',
        published: false,
        slug: 'my-page',
        title: 'My Page'
      },
      errors: {},
      valid: true
    } as never);

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
        { content: '', description: '', id: 'v1', imageAlt: '', imageCaption: '', language: 'es', title: 'Mi Página' }
      ])
    );

    const result = (await mod.actions.save({
      ...event,
      request: new Request('http://localhost', { body: formData, method: 'POST' })
    } as never)) as any;

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('form');
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

    // Mock superValidate to return valid for success case
    const { superValidate } = await import('sveltekit-superforms');
    (superValidate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        content: '',
        description: '',
        imageAlt: '',
        imageCaption: '',
        published: false,
        slug: 'new-page',
        title: 'New Page'
      },
      errors: {},
      valid: true
    } as never);

    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('title', 'New Page');
    formData.set('slug', 'new-page');
    formData.set('published', 'false');

    await expect(
      mod.actions.save({
        ...event,
        request: new Request('http://localhost', { body: formData, method: 'POST' })
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
      request: new Request('http://localhost', { body: formData, method: 'POST' })
    } as never)) as any;
    expect(result.status).toBe(400);
    expect(result.data.form).toBeDefined();
  });
});
