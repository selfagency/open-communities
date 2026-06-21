import uFuzzy from '@leeoniya/ufuzzy';
import { vi } from 'vitest';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import type { SearchData, SearchState } from '$lib/types.d';

// Shared spies that tests can inspect
export const setFiltersSpy = vi.fn();
export const setSearchTermsSpy = vi.fn();
export const toggleLocationSpy = vi.fn();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((FakeSearch as any).RESULTS_STORE) return (FakeSearch as any).RESULTS_STORE;

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
          if (idx !== -1) subscribers.splice(idx, 1);
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
  state = {
    // internal storage for test state
    _subscribers: [] as Array<
      (
        v: Readonly<SearchState>,
        oldV?: Readonly<SearchState> | undefined,
        changedKey?: keyof SearchState | undefined
      ) => void
    >,
    _value: {} as SearchState,

    get: vi.fn(),

    keys: vi.fn(),

    lc: 0,
    listen: vi.fn(),
    notify: vi.fn(),
    off: vi.fn(),
    set: vi.fn(),
    // minimal MapStore-like API used by components in tests
    setKey(key: string, v: unknown) {
      const old = this._value;
      this._value = { ...(this._value || {}), [key]: v } as SearchState;
      for (const s of this._subscribers) s(this._value, old as SearchState, key as keyof SearchState);
    },
    subscribe(
      listener: (
        v: Readonly<SearchState>,
        oldV?: Readonly<SearchState> | undefined,
        changedKey?: keyof SearchState | undefined
      ) => void
    ) {
      const wrapped = (
        v: Readonly<SearchState>,
        oldV?: Readonly<SearchState> | undefined,
        changedKey?: keyof SearchState | undefined
      ) => listener(v, oldV, changedKey);
      this._subscribers.push(wrapped);
      // call immediately with current value and no old/changedKey
      listener(this._value as Readonly<SearchState>, undefined, undefined);
      return () => {
        const i = this._subscribers.indexOf(wrapped);
        if (i !== -1) this._subscribers.splice(i, 1);
      };
    },
    value: {} as Record<string, unknown>,
    values: vi.fn()
  };
  stringFilter = vi.fn();
  toggleLocation = toggleLocationSpy;
  updateFilters = vi.fn();
  visible = true;
  adminFilter = () => [] as string[];
}
