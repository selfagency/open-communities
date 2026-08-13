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

// The route imports superValidate from the server subpath; mock it too.
vi.mock('sveltekit-superforms/server', () => ({
  ...mockSveltekitSuperforms,
  superValidate: mockSuperValidate
}));

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy<Record<string, string>>({} as Record<string, string>, {
    get: (_, key) => process.env[key as string] ?? ''
  })
}));

// Load function returns a PageServerLoad result shape
interface LoadResult {
  locales: string[];
  pagination: { total: number; page: number; search?: string };
  translations: Record<string, unknown>[];
}

const PB = 'http://*:8090';
const LT_URL = 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * Helper: creates a mock RequestEvent with an authenticated admin PocketBase client.
 */
async function createAdminEvent(overrides: Record<string, unknown> = {}) {
  const { createApi } = await import('$lib/server/api');
  const api = createApi();

  api.authStore.save('mock-token', {
    admin: true,
    collectionId: 'test',
    collectionName: 'users',
    email: 'admin@test.test',
    id: 'admin123',
    verified: true
  });

  const cookieOpts = { httpOnly: true, path: '/', sameSite: 'strict' as const, secure: false };

  return createMockRequestEvent({
    cookies: {
      get: () => '',
      serialize: () => '',
      set: () => {
        /* noop */
      }
    },
    locals: {
      api,
      capture: () => {
        /* noop */
      },
      captureException: () => {
        /* noop */
      },
      cookieOpts
    },
    ...overrides
  });
}

describe('admin/translations — translate action', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws 401 without auth', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.translate(event as never)).rejects.toThrow();
  });

  it('returns 400 when text is missing', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('locales', '["es","fr"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { error: string } }).data.error).toBe('Missing text or locales');
  });

  it('returns 400 when locales is missing', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { error: string } }).data.error).toBe('Missing text or locales');
  });

  it('returns 400 when locales is not valid JSON', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', 'not-json');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { error: string } }).data.error).toBe('Missing text or locales');
  });

  it('returns 500 when LibreTranslate is not configured', async () => {
    vi.stubEnv('LT_API_URL', '');
    vi.stubEnv('LT_API_KEY', '');

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es","fr"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(500);
    expect((result as { data: { error: string } }).data.error).toBe('LibreTranslate is not configured');
  });

  it('translates text to all requested locales on success', async () => {
    vi.stubEnv('LT_API_URL', LT_URL);
    vi.stubEnv('LT_API_KEY', '');

    server.use(
      http.post(`${LT_URL}/translate`, async ({ request: req }) => {
        const body = await req.clone().text();
        const parsed = JSON.parse(body);
        if (parsed.target === 'es') {
          return HttpResponse.json({ translatedText: 'Hola' });
        }
        if (parsed.target === 'fr') {
          return HttpResponse.json({ translatedText: 'Bonjour' });
        }
        return HttpResponse.json({ translatedText: `Translated(${parsed.target})` });
      })
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es","fr"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = (await mod.actions.translate({ ...event, request } as never)) as {
      success: boolean;
      translations: Array<{ locale: string; translatedText: string }>;
    };

    expect(result.success).toBe(true);
    expect(result.translations).toHaveLength(2);
    expect(result.translations).toContainEqual({ locale: 'es', translatedText: 'Hola' });
    expect(result.translations).toContainEqual({ locale: 'fr', translatedText: 'Bonjour' });
  });

  it('sends api_key header when LT_API_KEY is configured', async () => {
    vi.stubEnv('LT_API_URL', LT_URL);
    vi.stubEnv('LT_API_KEY', 'my-secret-key');

    // Use a flag to capture whether api_key was seen in any request body
    let sawApiKey = false;

    server.use(
      http.post(`${LT_URL}/translate`, async ({ request: req }) => {
        const body = await req.clone().text();
        const parsed = JSON.parse(body);
        if (parsed.api_key === 'my-secret-key') {
          sawApiKey = true;
        }
        return HttpResponse.json({ translatedText: 'Hola' });
      })
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = (await mod.actions.translate({ ...event, request } as never)) as {
      success: boolean;
    };

    expect(result.success).toBe(true);
    expect(sawApiKey).toBe(true);
  });

  it('returns partial results with errors when some locales fail', async () => {
    vi.stubEnv('LT_API_URL', LT_URL);
    vi.stubEnv('LT_API_KEY', '');

    server.use(
      http.post(`${LT_URL}/translate`, async ({ request: req }) => {
        const body = await req.clone().text();
        const parsed = JSON.parse(body);
        if (parsed.target === 'es') {
          return HttpResponse.json({ translatedText: 'Hola' });
        }
        // fr fails
        return HttpResponse.json({ error: 'Translation API error' }, { status: 500 });
      })
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es","fr"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);

    // Should succeed with partial results
    expect((result as { success?: boolean }).success).toBe(true);
    expect((result as { translations?: unknown[] }).translations).toHaveLength(1);
    expect((result as { translations?: Array<{ locale: string }> }).translations?.[0].locale).toBe('es');
    expect((result as { errors?: string[] }).errors).toBeDefined();
    expect((result as { errors?: string[] }).errors).toHaveLength(1);
  });

  it('returns 502 when all locales fail', async () => {
    vi.stubEnv('LT_API_URL', LT_URL);
    vi.stubEnv('LT_API_KEY', '');

    server.use(
      http.post(`${LT_URL}/translate`, () => HttpResponse.json({ error: 'Translation API error' }, { status: 500 }))
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es","fr"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(502);
    expect((result as { data: { error: string } }).data.error).toBe('Translation API error');
  });

  it('handles trailing slash in LT_API_URL', async () => {
    vi.stubEnv('LT_API_URL', `${LT_URL}/`);
    vi.stubEnv('LT_API_KEY', '');

    server.use(http.post(`${LT_URL}/translate`, () => HttpResponse.json({ translatedText: 'Hola' })));

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();
    formData.set('text', 'Hello');
    formData.set('locales', '["es"]');

    const request = new Request('http://localhost/admin/translations?/translate', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.translate({ ...event, request } as never);
    expect((result as { success?: boolean }).success).toBe(true);
  });
});

describe('admin/translations — load function', () => {
  it('returns empty translations when no records exist', async () => {
    server.use(
      http.get(`${PB}/api/collections/translations/records`, () =>
        HttpResponse.json({ items: [], page: 1, perPage: 500, totalItems: 0, totalPages: 1 })
      )
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const result = (await mod.load(event as never)) as unknown as LoadResult;

    expect(result.translations).toEqual([]);
    expect(result.locales).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('groups records by key and returns sorted locales', async () => {
    const records = [
      { collectionId: 't', collectionName: 'translations', id: '1', key: 'greeting', locale: 'en', value: 'Hello' },
      { collectionId: 't', collectionName: 'translations', id: '2', key: 'greeting', locale: 'es', value: 'Hola' },
      { collectionId: 't', collectionName: 'translations', id: '3', key: 'farewell', locale: 'en', value: 'Goodbye' },
      { collectionId: 't', collectionName: 'translations', id: '4', key: 'farewell', locale: 'fr', value: 'Au revoir' },
      { collectionId: 't', collectionName: 'translations', id: '5', key: 'greeting', locale: 'fr', value: 'Bonjour' }
    ];

    server.use(
      http.get(`${PB}/api/collections/translations/records`, () =>
        HttpResponse.json({ items: records, page: 1, perPage: 500, totalItems: 5, totalPages: 1 })
      )
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const result = (await mod.load(event as never)) as unknown as LoadResult;

    // Locales sorted: en, es, fr
    expect(result.locales).toEqual(['en', 'es', 'fr']);

    // Keys sorted alphabetically: farewell, greeting
    expect(result.translations).toHaveLength(2);
    const t0 = result.translations[0] as { key: string };
    expect(t0.key).toBe('farewell');
    const t1 = result.translations[1] as { key: string };
    expect(t1.key).toBe('greeting');

    // Each key has its entries
    const greeting = (result.translations as Array<{ key: string; entries: Array<{ locale: string }> }>).find(
      (t) => t.key === 'greeting'
    );
    expect(greeting?.entries).toHaveLength(3);
    expect(greeting?.entries.map((e) => e.locale).sort()).toEqual(['en', 'es', 'fr']);

    expect(result.pagination.total).toBe(2); // 2 keys
  });

  it('filters by search query', async () => {
    const capturedFilters: string[] = [];

    server.use(
      http.get(`${PB}/api/collections/translations/records`, ({ request }) => {
        const url = new URL(request.url);
        const filter = url.searchParams.get('filter') ?? '';
        capturedFilters.push(filter);

        if (filter.includes('greet')) {
          return HttpResponse.json({
            items: [
              {
                collectionId: 't',
                collectionName: 'translations',
                id: '1',
                key: 'greeting',
                locale: 'en',
                value: 'Hello'
              },
              {
                collectionId: 't',
                collectionName: 'translations',
                id: '2',
                key: 'greeting',
                locale: 'es',
                value: 'Hola'
              }
            ],
            page: 1,
            perPage: 500,
            totalItems: 2,
            totalPages: 1
          });
        }
        return HttpResponse.json({ items: [], page: 1, perPage: 500, totalItems: 0, totalPages: 1 });
      })
    );

    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent({
      url: new URL('http://localhost/admin/translations?q=greet')
    });
    const result = (await mod.load(event as never)) as unknown as LoadResult;

    expect(capturedFilters.length).toBeGreaterThanOrEqual(1);
    expect(capturedFilters[0]).toContain('greet');

    expect(result.translations).toHaveLength(1);
    const t0 = result.translations[0] as { key: string };
    expect(t0.key).toBe('greeting');
    expect(result.pagination.search).toBe('greet');
  });
});

describe('admin/translations — save action', () => {
  it('throws 401 without auth (sanity)', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.save(event as never)).rejects.toThrow();
  });

  it('returns 400 when key is missing', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();

    const request = new Request('http://localhost/admin/translations?/save', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.save({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { form: Record<string, unknown> } }).data.form).toBeDefined();
  });

  it('returns 500 when entries fail to save and no creates to roll back', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const { superValidate } = await import('sveltekit-superforms');

    // Mock superValidate to return valid for this specific test
    (superValidate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { entries: JSON.stringify([{ id: 'existing-1', locale: 'en', value: 'Hello' }]), key: 'test.key' },
      errors: {},
      valid: true
    } as never);

    // Mock PB update to fail
    server.use(
      http.patch(`${PB}/api/collections/translations/records/:id`, () =>
        HttpResponse.json({ error: 'Update failed' }, { status: 500 })
      )
    );

    const formData = new FormData();
    formData.set('key', 'test.key');
    formData.set('entries', JSON.stringify([{ id: 'existing-1', locale: 'en', value: 'Hello' }]));

    const request = new Request('http://localhost/admin/translations?/save', {
      body: formData,
      method: 'POST'
    });

    const event = await createAdminEvent({ request });
    const result = await mod.actions.save(event as never);
    expect((result as { status: number }).status).toBe(500);
    expect((result as { data: { error: string } }).data.error).toContain('failed to save');
  });
});

describe('admin/translations — add action', () => {
  it('throws 401 without auth (sanity)', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.add(event as never)).rejects.toThrow();
  });

  it('returns 400 when key is missing', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();

    const request = new Request('http://localhost/admin/translations?/add', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.add({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { form: Record<string, unknown> } }).data.form).toBeDefined();
  });
});

describe('admin/translations — delete action', () => {
  it('throws 401 without auth (sanity)', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = createMockRequestEvent();
    await expect(mod.actions.delete(event as never)).rejects.toThrow();
  });

  it('returns 400 when key is missing', async () => {
    const mod = await import('../../../routes/admin/translations/+page.server');
    const event = await createAdminEvent();
    const formData = new FormData();

    const request = new Request('http://localhost/admin/translations?/delete', {
      body: formData,
      method: 'POST'
    });

    const result = await mod.actions.delete({ ...event, request } as never);
    expect((result as { status: number }).status).toBe(400);
    expect((result as { data: { form: Record<string, unknown> } }).data.form).toBeDefined();
  });
});
