import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $app/environment to simulate browser
vi.mock('$app/environment', () => ({ browser: true }));

// Mock $app/state page object
vi.mock('$app/state', () => ({ page: { data: { user: { lang: 'es' } } } }));

// Provide a fake window dimensions in the global scope
if (typeof (globalThis as any).window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: { innerHeight: 800, innerWidth: 500 },
    writable: true
  });
}

import { initState, setState, state } from './stores';

beforeEach(() => {
  // Reset the store to initial state before each test
  state.$reset();
});

describe('stores', () => {
  it('setState merges partial updates into state', () => {
    state.setState({ lang: 'en', loading: false });
    setState({ loading: true });
    expect(state.loading).toBe(true);
    expect(state.lang).toBe('en');
  });

  it('initState populates defaults from window and page', () => {
    state.$reset();
    initState('es');
    expect(state.loading).toBe(false);
    expect(state.isMobile).toBe(true); // innerWidth 500 < 640
    expect(state.lang).toBe('es'); // from arg
    expect(state.offsetHeight).toBe(800);
    expect(state.offsetWidth).toBe(500);
    expect(state.showIntro).toBe(true);
  });
});
