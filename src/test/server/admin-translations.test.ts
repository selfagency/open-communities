import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: new Proxy<Record<string, string>>({} as Record<string, string>, {
    get: (_, key) => process.env[key as string] ?? ''
  })
}));

const GH_API = 'https://api.github.com';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

describe('parseLocales', () => {
  it('returns null for invalid JSON', async () => {
    const { validateTranslateInput } = await import('../../lib/server/admin-translations');
    expect(validateTranslateInput('text', 'not-json')).toBeNull();
  });

  it('returns empty array for valid JSON that is not an array', async () => {
    const { validateTranslateInput } = await import('../../lib/server/admin-translations');
    // JSON.parse succeeds but result is not an array → parseLocales returns []
    // validateTranslateInput then returns null because locales.length === 0
    expect(validateTranslateInput('text', '{"key":"value"}')).toBeNull();
  });

  it('returns null when text is missing', async () => {
    const { validateTranslateInput } = await import('../../lib/server/admin-translations');
    expect(validateTranslateInput('', '["es"]')).toBeNull();
  });

  it('returns null when locales string is missing', async () => {
    const { validateTranslateInput } = await import('../../lib/server/admin-translations');
    expect(validateTranslateInput('text', '')).toBeNull();
  });

  it('returns parsed locales on success', async () => {
    const { validateTranslateInput } = await import('../../lib/server/admin-translations');
    const result = validateTranslateInput('Hello', '["es","fr"]');
    expect(result).toEqual(['es', 'fr']);
  });
});

describe('getLibreTranslateConfig', () => {
  it('returns error when LT_API_URL is missing', async () => {
    vi.stubEnv('LT_API_URL', '');
    const { getLibreTranslateConfig } = await import('../../lib/server/admin-translations');
    const config = getLibreTranslateConfig();
    expect(config.error).toBe('LT_API_URL missing');
    expect(config.apiUrl).toBe('');
  });

  it('strips trailing slash from LT_API_URL', async () => {
    vi.stubEnv('LT_API_URL', 'http://localhost:5000/');
    const { getLibreTranslateConfig } = await import('../../lib/server/admin-translations');
    const config = getLibreTranslateConfig();
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(config.error).toBeNull();
  });

  it('preserves URL without trailing slash', async () => {
    vi.stubEnv('LT_API_URL', 'http://localhost:5000');
    const { getLibreTranslateConfig } = await import('../../lib/server/admin-translations');
    const config = getLibreTranslateConfig();
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(config.error).toBeNull();
  });
});

describe('getAdminClient', () => {
  it('throws when client is undefined', async () => {
    const { getAdminClient } = await import('../../lib/server/admin-translations');
    expect(() => getAdminClient({} as never)).toThrow('Unauthorized');
  });

  it('throws when authStore has no admin record', async () => {
    const { getAdminClient } = await import('../../lib/server/admin-translations');
    const locals = {
      api: {
        authStore: { record: { admin: false } }
      }
    };
    expect(() => getAdminClient(locals as never)).toThrow('Unauthorized');
  });

  it('returns client when admin is authenticated', async () => {
    const { getAdminClient } = await import('../../lib/server/admin-translations');
    const client = { authStore: { record: { admin: true } } };
    expect(getAdminClient({ api: client } as never)).toBe(client);
  });
});

describe('triggerDeploy', () => {
  it('returns deploymentUuid on successful deploy', async () => {
    let callCount = 0;
    server.use(
      http.get(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/runs`, () => {
        callCount++;
        // First call: prevRunId fetch returns id=99
        // Subsequent calls (poll): return id=100 so poll finds a new run
        return HttpResponse.json({
          workflow_runs: [{ id: callCount === 1 ? 99 : 100 }]
        });
      }),
      http.post(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/dispatches`, () =>
        HttpResponse.text('', { status: 204 })
      )
    );

    const { triggerDeploy } = await import('../../lib/server/admin-translations');
    const result = await triggerDeploy('fake-token', 'selfagency', 'open-communities');
    expect(result).toEqual({ deploymentUuid: '100' });
  });

  it('returns triggered message when poll times out', { timeout: 15_000 }, async () => {
    server.use(
      http.get(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/runs`, () =>
        HttpResponse.json({
          workflow_runs: [{ id: 100 }]
        })
      ),
      http.post(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/dispatches`, () =>
        HttpResponse.text('', { status: 204 })
      )
    );

    const { triggerDeploy } = await import('../../lib/server/admin-translations');
    // pollNewRunId will time out because the mock returns the same run ID
    const result = await triggerDeploy('fake-token', 'selfagency', 'open-communities');
    expect(result).toEqual({ message: 'Deploy triggered, but could not determine run ID', triggered: true });
  });

  it('throws when dispatch fails', async () => {
    server.use(
      http.get(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/runs`, () =>
        HttpResponse.json({ workflow_runs: [] })
      ),
      http.post(`${GH_API}/repos/selfagency/open-communities/actions/workflows/deploy.yml/dispatches`, () =>
        HttpResponse.text('Forbidden', { status: 403 })
      )
    );

    const { triggerDeploy } = await import('../../lib/server/admin-translations');
    await expect(triggerDeploy('bad-token', 'selfagency', 'open-communities')).rejects.toThrow('Dispatch failed: 403');
  });
});
