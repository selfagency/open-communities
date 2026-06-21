// Use the vitest-compatible jest-dom matchers and extend expect.
// Importing the full package at top-level can fail because `expect` may
// not be defined at module evaluation time in some runner setups.
// Import jest-dom matchers synchronously from our test stub and extend expect
// immediately so matchers are available before any test file executes.
// Import matchers from the local test mock via a relative path so Vite
// import-analysis doesn't need to resolve the package subpath.

// Use the official vitest integration for jest-dom matchers so they are
// registered against Vitest's `expect` before tests run.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { vi } from 'vitest';

// Polyfill Element.animate for jsdom (used by svelte transitions and some UI
// primitives). jsdom doesn't implement the Web Animations API, so make a
// minimal no-op implementation that provides a finished promise and lifecycle
// methods used by the app.
const { prototype } = Element;

if (typeof window !== 'undefined' && !prototype.animate) {
  // @ts-expect-error i don't have the types to handle this
  prototype.animate = function () {
    return {
      cancel: () => {},
      finished: Promise.resolve(),
      pause: () => {},
      play: () => {}
    };
  };
}

// Polyfill URL.createObjectURL which some libs (maplibre-gl) use to create
// worker blobs. jsdom/Node may provide a URL constructor but not createObjectURL.
// Important: do NOT replace `window.URL` with a plain object because Svelte
// and other libs expect it to be a constructor (extending it causes errors).
if (typeof window !== 'undefined') {
  try {
    const win = window as unknown as { URL?: unknown };

    // If URL is a constructor, add createObjectURL if missing.
    if (typeof win.URL === 'function') {
      const URLCtor = win.URL as unknown as {
        createObjectURL?: (b?: unknown) => string;
      };
      if (typeof URLCtor.createObjectURL !== 'function') {
        // assign a minimal function without referencing unknown args
        (URLCtor as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob://test';
      }
    } else if (typeof globalThis.URL === 'function') {
      // In some environments URL exists on globalThis but not window
      (win as { URL: unknown }).URL = globalThis.URL;
      const URLCtor = (win as { URL: unknown }).URL as unknown as {
        createObjectURL?: (b?: unknown) => string;
      };
      if (typeof URLCtor.createObjectURL !== 'function') {
        (URLCtor as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob://test';
      }
    }
  } catch (e) {
    // be resilient in very locked-down environments
  }
}

// Some UI libraries schedule cleanup work (timeouts) that may run after the
// test environment tears down and `document` becomes undefined. Provide a
// minimal, resilient fallback so those cleanup callbacks don't throw a
// ReferenceError. If jsdom is present this will be a no-op.
if (typeof globalThis.document === 'undefined') {
  // Minimal document/body mock with the shape used by bits-ui body-scroll-lock
  (globalThis as Record<string, unknown>).document = {
    body: {
      setAttribute: () => {},
      style: {
        removeProperty: () => {}
      }
    }
  };
}

// Minimal mocks for SvelteKit runtime modules used by components
vi.mock('$app/navigation', () => ({
  afterNavigate: () => undefined,
  beforeNavigate: () => undefined,
  goto: async () => Promise.resolve(),
  invalidate: async () => Promise.resolve(),
  invalidateAll: () => undefined
}));

// Provide a tiny cookie helper used by server modules (node `cookie` package)
vi.mock('cookie', () => ({
  // parse should accept a cookie string and return an object; tests pass
  // a simple 'pb_auth=...' string so a minimal parse implementation is fine.
  parse: (s: string) => {
    try {
      return Object.fromEntries(
        s.split(';').map((p) => {
          const [k, ...r] = p.split('=');
          return [k.trim(), decodeURIComponent(r.join('='))];
        })
      );
    } catch (e) {
      return {};
    }
  }
}));

// Nodemailer is Node-only and pulls in streams/os APIs; provide a minimal
// mock used by server tests that import it so transforms won't execute
// node-only code in the browser runner.
vi.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: async () => ({ messageId: 'mock' })
  })
}));

// Provide a deterministic environment for tests: not in dev and not in browser
vi.mock('$app/environment', () => ({
  browser: false,
  dev: false
}));

// mark runtime as test so components can make test-friendly shortcuts
(globalThis as Record<string, unknown>).__TEST__ = true;

vi.mock('$app/state', () => {
  // page is a store; page.data.user should itself be a store for $derived(page.data.user)
  // a writable-like store for page.data.user so tests can call .set() to change the user
  let _userValue: unknown = null;
  const _userSubscribers = new Set<(v: unknown) => void>();
  const userStore = {
    set(next: unknown) {
      _userValue = next;
      for (const s of _userSubscribers) s(_userValue);
    },
    subscribe: (fn: (v: unknown) => void) => {
      _userSubscribers.add(fn);
      fn(_userValue);
      return () => _userSubscribers.delete(fn);
    },
    update(updater: (v: unknown) => unknown) {
      _userValue = updater(_userValue);
      for (const s of _userSubscribers) s(_userValue);
    }
  };

  // expose for tests to import and mutate
  (globalThis as any).__TEST_USER_STORE__ = userStore;

  // minimal searchParams-like object used by components (page.url.searchParams.has/get)
  const fakeSearchParams = {
    get() {
      return null as null;
    },
    has() {
      return false;
    }
  };

  const page = {
    // also expose data for direct access if needed
    data: { user: userStore },
    // page store subscribe
    subscribe: (fn: (v: unknown) => void) => {
      fn({
        data: { user: userStore },
        url: { searchParams: fakeSearchParams }
      });
      return () => {};
    },
    // provide a minimal url with searchParams used in components
    url: { searchParams: fakeSearchParams }
  };

  return { page };
});

// Mock side-effecting modules used in components
vi.mock('svelte-copy', () => ({
  copyText: vi.fn()
}));

vi.mock('svelte-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// bits-ui schedules a cleanup that touches document after test teardown in some cases.
// bits-ui is aliased during tests to local stubs under src/test/stubs to provide
// the UI primitives the app imports (Dialog, Select, etc.). Avoid mocking here
// so those stubs are used directly.

// Use internal test API to centralize test stubs
import * as testApi from '$test/api';

// Provide a test stub for formsnap primitives used by the form UI wrappers
// Use doMock so the mock factory runs after imports (avoid hoisting issues).
vi.doMock('formsnap', () => testApi.formsnap);

// Use shared sveltekit-superforms stub for tests
vi.doMock('sveltekit-superforms', () => testApi.superforms);

// Provide a safe messages stub for paraglide translations used throughout the app.
// Many components call m.someKey() — return a function that yields the key name
// so rendered buttons/labels are predictable and searchable in tests.
vi.mock('$lib/paraglide/messages', () => {
  const m = new Proxy(
    {},
    {
      get: (_target: unknown, prop: unknown) => {
        const key = String(prop);
        return () => key;
      }
    }
  );
  return { m };
});

// Provide UI component stubs (sheet etc.) used by global components via test API
vi.mock('$lib/components/ui/sheet', () => testApi.sheet);

// Mock SVG component imports to use our test implementations
vi.mock('$lib/assets/find.svg?component', async () => {
  const mod = await import('$test/mocks/assets/find.svelte');
  return mod;
});
vi.mock('$lib/assets/mask.svg?component', async () => {
  const mod = await import('$test/mocks/assets/mask.svelte');
  return mod;
});
vi.mock('$lib/assets/asl.svg?component', async () => {
  const mod = await import('$test/mocks/assets/asl.svelte');
  return mod;
});
vi.mock('$lib/assets/tent.svg?component', async () => {
  const mod = await import('$test/mocks/assets/tent.svelte');
  return mod;
});
vi.mock('$lib/assets/inclusive.svg?component', async () => {
  const mod = await import('$test/mocks/assets/inclusive.svelte');
  return mod;
});
vi.mock('$lib/assets/rabbis4ceasefire.svg?component', async () => {
  const mod = await import('$test/mocks/assets/rabbis4ceasefire.svelte');
  return mod;
});
vi.mock('$lib/assets/menorah.svg?component', async () => {
  const mod = await import('$test/mocks/assets/menorah.svelte');
  return mod;
});
vi.mock('$lib/assets/siddur.svg?component', async () => {
  const mod = await import('$test/mocks/assets/siddur.svelte');
  return mod;
});

// Ensure DOM is cleaned up between tests to avoid queries matching previous
// renders. This prevents the "Found multiple elements" errors when tests
// accidentally query the global document.
afterEach(() => {
  cleanup();
});

// Provide minimal `process` for browser runner tests that reference process.env
if (typeof (globalThis as unknown as { process?: unknown }).process === 'undefined') {
  // keep it minimal; tests only read `process.env` in a few places
  (globalThis as unknown as Record<string, unknown>).process = { env: {} };
}

// Some server code (and tests) reference the Node `global` variable. Create
// a `global` binding so those references work in the browser runner. We use
// indirect eval to ensure we assign a top-level global variable instead of
// merely setting a property on `globalThis` (which doesn't create the
// `global` identifier in module scope).
try {
  (0, eval)('global = globalThis');
} catch (e) {
  // best-effort; some runtimes prevent eval
}

// Set deterministic viewport/document sizes used by some tests. Tests expect
// offset/inner sizes (for example, the stores.initState test expects
// offsetHeight = 800 and offsetWidth = 500), so make those values stable here.
if (typeof window !== 'undefined') {
  // Force exact values that tests expect
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 500,
    writable: true
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 800,
    writable: true
  });

  // documentElement/client and body/offset used by some layout helpers
  if (typeof document !== 'undefined' && document.documentElement) {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 500,
      writable: true
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: 800,
      writable: true
    });
  }
  if (typeof document !== 'undefined' && document.body) {
    Object.defineProperty(document.body, 'offsetWidth', {
      configurable: true,
      value: 500,
      writable: true
    });
    Object.defineProperty(document.body, 'offsetHeight', {
      configurable: true,
      value: 800,
      writable: true
    });
  }
}

// Optional SVG debug section removed temporarily to debug syntax issues
