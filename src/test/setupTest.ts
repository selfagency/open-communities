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
			const URLCtor = win.URL as unknown as { createObjectURL?: (b?: unknown) => string };
			if (typeof URLCtor.createObjectURL !== 'function') {
				// assign a minimal function without referencing unknown args
				(URLCtor as unknown as { createObjectURL: () => string }).createObjectURL = () =>
					'blob://test';
			}
		} else if (typeof globalThis.URL === 'function') {
			// In some environments URL exists on globalThis but not window
			(win as { URL: unknown }).URL = globalThis.URL;
			const URLCtor = (win as { URL: unknown }).URL as unknown as {
				createObjectURL?: (b?: unknown) => string;
			};
			if (typeof URLCtor.createObjectURL !== 'function') {
				(URLCtor as unknown as { createObjectURL: () => string }).createObjectURL = () =>
					'blob://test';
			}
		}
	} catch {
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
			return Object.fromEntries(s.split(';').map(p => {
				const [k, ...r] = p.split('=');
				return [k.trim(), decodeURIComponent(r.join('='))];
			}));
		} catch {
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
	globalThis.__TEST_USER_STORE__ = userStore;

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
			fn({ data: { user: userStore }, url: { searchParams: fakeSearchParams } });
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

// Ensure DOM is cleaned up between tests to avoid queries matching previous
// renders. This prevents the "Found multiple elements" errors when tests
// accidentally query the global document.
afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// Map `$lib/assets/*.svg?component` imports to our test mocks.
//
// Many components import SVGs with the `?component` query (handled by a
// Vite plugin in the app). During tests those imports may resolve to raw
// assets instead of Svelte components which causes runtime errors like
// "X is not a function". To avoid having to mock every asset by hand,
// glob-load the prepared JS mocks under `src/test/mocks/assets/*.svg.js`
// and register them with Vitest so an import like
// `$lib/assets/find.svg?component` returns the component constructor.
//
// This uses Vite's import.meta.glob to eagerly load the mock modules at
// setup-time and then calls `vi.doMock` for each corresponding
// `$lib/assets/<name>.svg?component` specifier.
try {
	// import.meta.glob is available in Vite-run tests; use eager to get modules
	const modules = import.meta.glob('../test/mocks/assets/*.svg.js', { eager: true });

	for (const p of Object.keys(modules)) {
		// p looks like '../test/mocks/assets/find.svg.js'
		const match = p.match(/\.\.\/test\/mocks\/assets\/(.+)\.svg\.js$/);
		if (!match) continue;
		const name = match[1];

		// map to the same specifier used in app code
		const spec = `$lib/assets/${name}.svg?component`;

		// capture the actual module object
		const mod = modules[p];

		// Ensure we provide an ES module shape: default + named exports.
		const esm = {
			default: mod && (mod.default || mod),
			...(mod && typeof mod === 'object' ? mod : {})
		};

		// Register the mock eagerly so importing modules receive the mocked
		// Svelte component constructor as the default export.
		try {
			vi.mock(spec, () => esm);
		} catch {
			// some runners may disallow mocking here; fail silently
		}
	}
} catch {
	// be defensive in environments where import.meta.glob isn't available
}
