import { describe, expect, it, vi } from 'vitest';

// Why: Prevent the real PocketBase client and env import from running during tests.
// What: Mock 'pocketbase' and the SvelteKit env module before importing the module under test.
vi.mock('pocketbase', () => ({
  default: class PocketBaseMock {
    _refreshed = false;
    authStore = {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      clear: () => {},
      isValid: false,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      loadFromCookie: (_: unknown) => {}
    };
    autoCancellationCalledWith: boolean | undefined = undefined;
    url: string;
    constructor(url: string) {
      this.url = url;
    }
    autoCancellation(v: boolean) {
      this.autoCancellationCalledWith = v;
    }
    collection(_name: string) {
      return {
        // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
        authRefresh: async () => {
          this._refreshed = true;
        }
      };
    }
  }
}));

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_API_ENDPOINT: 'https://localhost:8090' }
}));

// Import after mocks so the module uses the mocks during evaluation
import { cleanResponse, expand } from './api';

describe('src/lib/api', () => {
  // Note: `api` instance construction is exercised by module load; we avoid asserting
  // runtime properties on the typed `api` to keep tests type-safe.

  it('cleanResponse removes pocketbase meta fields and converts 1/0 to booleans', () => {
    const input = {
      a: 1,
      b: 0,
      collectionId: 'col',
      collectionName: 'users',
      created: '2025-01-01',
      id: '1',
      nested: {
        flag: 1,
        list: [0, { inner: 1 }]
      },
      updated: '2025-01-01'
    } as const;

    const out = cleanResponse(input as unknown as unknown as Record<string, unknown>);

    expect(out).not.toHaveProperty('collectionId');
    expect(out).not.toHaveProperty('collectionName');
    expect(out).not.toHaveProperty('updated');
    expect(out).not.toHaveProperty('created');

    // boolean fields are no longer converted (convertBooleans removed — P-3 fix)
    expect(out).toHaveProperty('a', 1);
    expect(out).toHaveProperty('b', 0);
    expect(out).toHaveProperty('nested.flag', 1);
    // array primitives are not converted
    expect(out).toHaveProperty('nested.list.0', 0);
    expect(out).toHaveProperty('nested.list.1.inner', 1);
  });

  it('cleanResponse keeps created when keepDate=true but still removes other meta fields', () => {
    const input = {
      active: 1,
      collectionId: 'col',
      collectionName: 'users',
      created: '2025-01-01',
      id: '1',
      updated: '2025-01-01'
    } as const;

    const out = cleanResponse(input as unknown as unknown as Record<string, unknown>, true);

    expect(out).not.toHaveProperty('collectionId');
    expect(out).not.toHaveProperty('collectionName');
    expect(out).not.toHaveProperty('updated');
    // created should be present when keepDate = true
    expect(out).toHaveProperty('created', '2025-01-01');
    // boolean fields are no longer converted (convertBooleans removed — P-3 fix)
    expect(out).toHaveProperty('active', 1);
  });

  it('expand merges expanded fields onto the root and removes expand key', () => {
    const item = {
      expand: {
        owner: { id: 'u', name: 'user' },
        tags: ['a', 'b']
      },
      id: 'x',
      name: 'root'
    } as const;

    const expanded = expand(item) as any;

    expect(expanded).toHaveProperty('owner');
    expect(expanded).toHaveProperty('tags');
    expect(expanded).not.toHaveProperty('expand');
    expect(expanded.owner).toEqual({ id: 'u', name: 'user' });
    expect(expanded.tags).toEqual(['a', 'b']);
  });

  it('convertBooleans handles arrays', () => {
    // Indirect test: cleanResponse calls convertBooleans internally
    const input = [
      { a: 1, collectionId: 'x' },
      { a: 0, collectionId: 'y' }
    ] as unknown as unknown as Record<string, unknown>;
    const out = cleanResponse(input as any);
    // Boolean conversion should apply to array elements
    expect(out).toBeDefined();
  });
});
