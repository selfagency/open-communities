import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock persistent persistentMap to a simple in-memory map for tests
vi.mock('@nanostores/persistent', () => {
	const store = new Map<string, unknown>();
	const persistentMap = (key: string, initial: unknown) => {
		let value: unknown = initial;
		return {
			get: () => value,
			set: (v: unknown) => {
				value = v;
				store.set(key, v);
			}
		};
	};
	return { persistentMap };
});

// Mock radashi.assign as a simple shallow merge
vi.mock('radashi', () => ({
	assign: (a: unknown, b: unknown) => ({
		...(a as Record<string, unknown>),
		...(b as Record<string, unknown>)
	})
}));

// Mock $app/state page object
vi.mock('$app/state', () => ({ page: { data: { user: { lang: 'es' } } } }));

// Provide a fake window dimensions in the global scope
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).window === 'undefined') {
	Object.defineProperty(globalThis, 'window', {
		value: { innerHeight: 800, innerWidth: 500 },
		writable: true
	});
}

import { initState, setState, state } from './stores';

beforeEach(() => {
	// reset the persistent-backed state to empty
	state.set({});
});

describe('stores', () => {
	it('setState merges partial updates into state', () => {
		state.set({ lang: 'en', loading: false });
		setState({ loading: true });
		expect(state.get().loading).toBe(true);
		expect(state.get().lang).toBe('en');
	});

	it('initState populates defaults from window and page', () => {
		// start empty
		state.set({});
		initState();
		const s = state.get();
		expect(s.loading).toBe(false);
		expect(s.isMobile).toBe(true); // innerWidth 500 < 640
		expect(s.lang).toBe('es'); // from mocked page.data.user.lang
		expect(s.offsetHeight).toBe(800);
		expect(s.offsetWidth).toBe(500);
		expect(s.showIntro).toBe(true);
	});
});
