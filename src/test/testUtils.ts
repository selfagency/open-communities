/**
 * Creates a mock RequestEvent for testing SvelteKit server actions
 */
export function createMockRequestEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    cookies: {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      delete: () => {},
      get: () => '',
      getAll: () => [],
      serialize: () => '',
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      set: () => {}
    },
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    depends: () => {},
    fetch,
    getClientAddress: () => '127.0.0.1',
    isDataRequest: false,
    isRemoteRequest: false,
    isSubRequest: false,
    locals: {},
    params: {},
    parent: async () => ({ countries: [], lang: 'en', offline: false, user: null }),
    platform: {},
    request: new Request('http://localhost/'),
    route: { id: '/' },
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
    setHeaders: () => {},
    tracing: { enabled: false, root: {} as any, current: {} as any },
    untrack: <T>(fn: () => T) => fn(),
    url: new URL('http://localhost/'),
    ...overrides
  };
}

/**
 * Creates a mock ServerLoadEvent for testing SvelteKit server load functions
 */
export function createMockServerLoadEvent(overrides: Partial<Record<string, unknown>> = {}) {
  const event = createMockRequestEvent();
  return { ...event, ...overrides };
}

// Return the test user store created in setupTest.ts at runtime. We use a function
// so the store lookup happens after Vitest runs the setup file that initializes
// the global. Importing the store directly at module load time can be too early.
export function getUserStore() {
  // If setupTest hasn't initialized the global store for some reason,
  // create a minimal writable-like store so tests can proceed.
  if (!(globalThis as Record<string, unknown>).__TEST_USER_STORE__) {
    let _value: unknown = null;
    const subs = new Set<(v: unknown) => void>();
    const store = {
      set(next: unknown) {
        _value = next;
        for (const s of subs) {
          s(_value);
        }
      },
      subscribe(fn: (v: unknown) => void) {
        subs.add(fn);
        fn(_value);
        return () => subs.delete(fn);
      },
      update(updater: (v: unknown) => unknown) {
        _value = updater(_value);
        for (const s of subs) {
          s(_value);
        }
      }
    };
    (globalThis as Record<string, unknown>).__TEST_USER_STORE__ = store;
  }
  return (globalThis as Record<string, unknown>).__TEST_USER_STORE__;
}

/**
 * Shared mock for sveltekit-superforms - use with vi.mock()
 */
import { writable } from 'svelte/store';

export const mockSveltekitSuperforms = {
  message: () => ({}),
  setError: () => ({}),
  superForm: (initialForm = {}) => {
    // create writable stores for fields commonly used by components
    const formStore = writable(initialForm);
    const errorsStore = writable({});
    const delayed = writable(false);
    const message = writable(null);
    const posted = writable(false);
    const submitting = writable(false);
    const timeout = writable(null);

    return {
      allErrors: () => [],
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      capture: () => {},
      constraints: {},
      delayed,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      enhance: () => {},
      errors: errorsStore,
      form: formStore,
      isTainted: () => false,
      message,
      posted,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      reset: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      restore: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      submit: () => {},
      submitting,
      timeout,
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      validate: () => {},
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional noop mock
      validateField: () => {}
    };
  },
  superValidate: () => ({})
};

/**
 * Create minimal props for components that expect a SuperForm-like `form`,
 * a `formData` store and an `errors` store.
 */
export function makeMockFormProps(formData = {}, errors = {}) {
  // create writable stores so UI components that call set/update work
  const formDataStore = writable(formData);
  const errorsStore = writable(errors);

  const base = mockSveltekitSuperforms.superForm(formData);
  // shallow clone and set helpful properties
  const f = { ...base };
  (f as any).formId = 'test';
  (f as any).options = {};
  (f as any).tainted = false;
  (f as any).validateForm = () => ({ valid: true });
  // ensure .form and .errors are writable stores
  f.form = formDataStore;
  f.errors = errorsStore;

  return { errors: errorsStore, form: f as any, formData: formDataStore };
}

/**
 * Build FormData from a plain object for test assertions.
 * Supports string and string[] values.
 */
export function formData(record: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(record)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.set(k, v);
    }
  }
  return fd;
}

/**
 * Mock PocketBase API client with optional auth context.
 * Returns a minimal mock with common collection methods.
 */
export function mockPbApi(userId?: string) {
  return {
    authStore: {
      model: userId ? { id: userId, email: 'test@test.local' } : null,
      isValid: !!userId
    },
    collection: (_name: string) => ({
      getFullList: async () => [],
      getOne: async (id: string) => ({ id }),
      getFirstListItem: async () => null,
      create: async (data: Record<string, unknown>) => ({ id: 'new-id', ...data }),
      update: async (id: string, data: Record<string, unknown>) => ({ id, ...data }),
      delete: async (_id: string) => true
    })
  };
}
