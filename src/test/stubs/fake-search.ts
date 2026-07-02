import uFuzzy from '@leeoniya/ufuzzy';
import { vi } from 'vitest';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import type { SearchData, SearchState } from '$lib/types.d';

// Shared spies that tests can inspect
export const setFiltersSpy = vi.fn();
export const setSearchTermsSpy = vi.fn();
export const toggleLocationSpy = vi.fn();

type FakeStoreSubscriber = (v: SearchState) => void;

/** Minimal Stately-like store for the fake Search class. */
function createFakeStore(): {
  showLocation: boolean;
  searchTerms: string;
  searchLocation: Partial<LocationMeta>;
  filters: Record<string, Record<string, boolean>>;
  subscribe: (fn: FakeStoreSubscriber) => () => void;
  setSearchTerms: (t: string) => void;
  setSearchLocation: (l: Partial<LocationMeta>) => void;
  setFilters: (f: Record<string, Record<string, boolean>>) => void;
  resetSearchTerms: () => void;
  resetLocation: () => void;
  resetFilters: () => void;
  resetAll: () => void;
  toggleLocation: () => void;
} {
  let _state: SearchState = {
    showLocation: false,
    searchTerms: '',
    searchLocation: {},
    filters: {}
  };
  const subs = new Set<FakeStoreSubscriber>();
  function _notify() {
    for (const fn of subs) {
      fn(_state as SearchState);
    }
  }
  return {
    get showLocation() {
      return _state.showLocation ?? false;
    },
    set showLocation(v: boolean) {
      _state = { ..._state, showLocation: v };
      _notify();
    },
    get searchTerms() {
      return _state.searchTerms ?? '';
    },
    set searchTerms(v: string) {
      _state = { ..._state, searchTerms: v };
      _notify();
    },
    get searchLocation() {
      return _state.searchLocation ?? {};
    },
    set searchLocation(v: Partial<LocationMeta>) {
      _state = { ..._state, searchLocation: v };
      _notify();
    },
    get filters() {
      return _state.filters ?? {};
    },
    set filters(v: Record<string, Record<string, boolean>>) {
      _state = { ..._state, filters: v };
      _notify();
    },
    subscribe(fn: FakeStoreSubscriber) {
      fn(_state as SearchState);
      subs.add(fn);
      return () => subs.delete(fn);
    },
    setSearchTerms(t: string) {
      this.searchTerms = t;
    },
    setSearchLocation(l: Partial<LocationMeta>) {
      this.searchLocation = l;
    },
    setFilters(f: Record<string, Record<string, boolean>>) {
      this.filters = f;
    },
    resetSearchTerms() {
      this.searchTerms = '';
    },
    resetLocation() {
      this.searchLocation = {};
    },
    resetFilters() {
      this.filters = {};
    },
    resetAll() {
      _state = { showLocation: false, searchTerms: '', searchLocation: {}, filters: {} };
      _notify();
    },
    toggleLocation() {
      this.showLocation = !this.showLocation;
    }
  };
}

export class FakeSearch {
  applyAllFilters = vi.fn();
  boolFilter = vi.fn();
  clearFilters = vi.fn();
  data: SearchData[] = [];
  debug = false;
  filteredIds: unknown[] = [];
  filterOptions: Record<string, unknown> = {};
  filters: Record<string, unknown> = {};
  fuzzy = new uFuzzy();
  getFilters = vi.fn();
  hasFilters = vi.fn();
  ids: string[] = [];
  isFiltered = false;
  location: unknown = undefined;
  name = '';
  onFilterChange = vi.fn();
  owner = '';
  resetAll = vi.fn();
  resetFilters = vi.fn();
  resetLocation = vi.fn();
  resetSearchTerms = vi.fn();
  // Minimal store implementation for tests. Ensures $results is always defined and
  // subscribers are called synchronously with the current value.
  // Allow tests to inject a shared RESULTS_STORE override before instances are
  // created. If not provided, create a default per-instance store.
  results = (() => {
    // If tests placed a static RESULTS_STORE on the class, use it so all
    // instances share the same store and tests can manipulate it easily.
    if ((FakeSearch as any).RESULTS_STORE) {
      return (FakeSearch as any).RESULTS_STORE;
    }

    let value: CongregationMetaRecord[] = [];
    const subscribers: Array<(v: CongregationMetaRecord[]) => void> = [];

    return {
      get: () => value,
      lc: 0,
      listen: vi.fn(),
      notify: (v: CongregationMetaRecord[]) => {
        value = v;
        subscribers.forEach((s) => s(value));
      },
      off: vi.fn(),
      set: (v: CongregationMetaRecord[]) => {
        value = v;
        subscribers.forEach((s) => s(value));
      },
      subscribe: (fn: (v: CongregationMetaRecord[]) => void) => {
        subscribers.push(fn);
        // call immediately with current value like Svelte stores
        fn(value);
        return () => {
          const idx = subscribers.indexOf(fn);
          if (idx !== -1) {
            subscribers.splice(idx, 1);
          }
        };
      },
      value
    };
  })();
  searchLocation: unknown = undefined;
  searchTerms = '';
  selectedFilters: Record<string, unknown> = {};
  setFilters = setFiltersSpy;
  setSearchLocation = vi.fn();
  setSearchTerms = setSearchTermsSpy;
  setShowLocation = vi.fn();
  setVisible = vi.fn();
  showLocation = false;
  /** Stately store instance (aliased by `state` getter). */
  store = createFakeStore();
  /** Backward-compat accessor matching the real Search class. */
  get state() {
    return this.store;
  }
  stringFilter = vi.fn();
  toggleLocation = toggleLocationSpy;
  updateFilters = vi.fn();
  visible = true;
  adminFilter = () => [] as string[];
}
