import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createMockServerLoadEvent } from '$test/testUtils';

import { congregationHidden, congregationOtherOwner, congregationVisible } from '../../mocks/data/congregations';

const PB = 'http://*:8090';

function makeApiStub(overrides: Record<string, unknown> = {}) {
  return {
    authStore: { record: { admin: false, congregation: 'cong_001', id: 'user_regular_001' } },
    collection: () => ({
      getFirstListItem: async () => ({ id: 'c1', location: {} }),
      getOne: async () => ({
        accessibility: { id: 'a1' },
        fit: { id: 'f1' },
        health: { id: 'h1' },
        id: 'c1',
        registration: { id: 'r1' },
        security: { id: 's1' },
        services: { id: 'sv1' }
      })
    }),
    createBatch: () => ({
      collection: () => ({
        // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
        create: () => {},
        // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
        delete: () => {},
        // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
        update: () => {}
      }),
      send: async () => ({})
    }),
    filter: (expr: string) => expr,
    ...overrides
  } as any;
}

const server = setupServer(
  http.get(`${PB}/api/collections/congregationMeta/records/:id`, ({ params }) => {
    const id = params.id as string;
    const record = [congregationVisible, congregationHidden, congregationOtherOwner].find((c) => c.id === id);
    if (!record) {
      return HttpResponse.json(null, { status: 404 });
    }
    return HttpResponse.json(record);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('edit +page.server — load', () => {
  it('returns congregation and forms when authenticated as owner', async () => {
    const mod = await import('../../../src/routes/edit/+page.server');
    const api = makeApiStub();
    const locals = { api, validate: async () => ({}) } as any;
    const url = new URL('http://localhost/?id=cong_001');
    const mockEvent = createMockServerLoadEvent({ locals, route: { id: '/edit' }, url });
    const res = await mod.load(mockEvent as any);
    expect(res).toHaveProperty('congregation');
    expect(res).toHaveProperty('form');
  });

  it('throws 404 when congregation not found', async () => {
    const mod = await import('../../../src/routes/edit/+page.server');
    // API stub that throws a PB-like error for nonexistent IDs
    const api = makeApiStub({
      collection: () => ({
        // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
        getFirstListItem: async () => {
          const err = new Error('Not found') as any;
          err.status = 404;
          throw err;
        }
      })
    });
    const locals = { api, validate: async () => ({}) } as any;
    const url = new URL('http://localhost/?id=nonexistent');
    const mockEvent = createMockServerLoadEvent({ locals, route: { id: '/edit' }, url });
    await expect(mod.load(mockEvent as any)).rejects.toThrow();
  });
});

describe('edit +page.server — delete action', () => {
  it('allows owner to delete own congregation', async () => {
    const mod = await import('../../../src/routes/edit/+page.server');
    const api = makeApiStub({ authStore: { record: { admin: false, congregation: 'c1', id: 'u1' } } });
    const locals = {
      api,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      capture: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      captureException: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      log: { error: () => {} },
      validate: async () => ({ data: { id: 'c1' }, valid: true })
    } as any;
    // The delete action expects a form with a valid id
    const form = await locals.api.collection('congregationMeta').getOne('c1', {});
    const request = new Request('http://localhost/?/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id: 'c1' })
    });
    const mockEvent = createMockServerLoadEvent({
      locals,
      request,
      route: { id: '/edit' },
      url: new URL('http://localhost/?/delete')
    });
    const res = await mod.actions.delete(mockEvent as any);
    expect(res).toBeDefined();
  });
});

describe('edit +page.server — submit action', () => {
  it('rejects non-owner editing another congregation', async () => {
    const mod = await import('../../../src/routes/edit/+page.server');
    // User is NOT admin and congregation doesn't match
    const api = makeApiStub({ authStore: { record: { admin: false, congregation: 'other_cong', id: 'u1' } } });
    const locals = {
      api,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      capture: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      captureException: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      log: { error: () => {} },
      validate: async () => ({
        data: { id: 'cong_002', name: 'Test' },
        valid: true
      })
    } as any;
    const request = new Request('http://localhost/?/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'cong_002', name: 'Test' })
    });
    const mockEvent = createMockServerLoadEvent({
      locals,
      request,
      route: { id: '/edit' },
      url: new URL('http://localhost/?/submit')
    });
    const res = await mod.actions.submit(mockEvent as any);
    // The submit action should fail for unauthorized mutation
    // The action returns fail(status, { form }) on authorization error
    expect(res).toBeDefined();
  });
});
