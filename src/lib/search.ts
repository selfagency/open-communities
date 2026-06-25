/* region imports */

import Fuzzy from '@leeoniya/ufuzzy';
import { alphabetical, isEmpty, isEqual, shake } from 'radashi';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import type { LocationMeta, SearchData, SearchState } from '$lib/types.d';

/* endregion imports */

/* ------------------------------------------------------------------ */
/*  Minimal Svelte store helpers — replaces nanostores deepMap/computed */
/* ------------------------------------------------------------------ */

type Subscriber<T> = (v: T) => void;
type Unsubscriber = () => void;
interface Readable<T> {
  subscribe: (run: Subscriber<T>) => Unsubscriber;
}

function writableDeep<T extends Record<string, unknown>>(
  initial: T
): Readable<T> & { get(): T; setKey<K extends keyof T>(k: K, v: T[K]): void } {
  let value = { ...initial };
  const subs = new Set<Subscriber<T>>();
  function notify() {
    for (const fn of subs) {
      fn(value);
    }
  }
  return {
    subscribe(run: Subscriber<T>) {
      run(value);
      subs.add(run);
      return () => subs.delete(run);
    },
    get() {
      return value;
    },
    setKey<K extends keyof T>(k: K, v: T[K]) {
      if (k === '__proto__' || k === 'constructor') {
        return;
      }
      if (value[k] === v) {
        return; // skip notification on no-op
      }
      value = { ...value, [k]: v };
      notify();
    }
  };
}

function derived<T, D>(source: Readable<T>, fn: (v: T) => D): Readable<D> {
  let current: D = undefined as unknown as D;
  const subs = new Set<Subscriber<D>>();

  source.subscribe((v) => {
    const next = fn(v);
    // Skip notification when the value hasn't changed (deep equality).
    // The fn creates a new array on every call — without deep comparison,
    // every source change would cascade to all subscribers even if the
    // computed result is semantically identical.
    if (!isEqual(next, current)) {
      current = next;
      for (const fn of subs) {
        fn(current);
      }
    }
  });

  return {
    subscribe(run: Subscriber<D>) {
      if (current !== undefined) {
        run(current);
      }
      subs.add(run);
      return () => subs.delete(run);
    }
  };
}

/* ------------------------------------------------------------------ */
/*  Search engine                                                      */
/* ------------------------------------------------------------------ */

export class Search {
  data: SearchData[];
  debug: boolean;
  fuzzy: Fuzzy;
  ids: string[];
  results: Readable<CongregationMetaRecord[]>;
  state: ReturnType<typeof writableDeep<SearchState>>;

  // Pre-built indexes for fast filtering
  /** Map<filterKey, Map<valueKey, Set<rowIndex>>> */
  private readonly boolIndex = new Map<string, Map<string, Set<number>>>();
  /** Map<filterKey, Map<targetKey, Map<value, Set<number>>>> */
  private readonly stringIndex = new Map<string, Map<string, Map<string, Set<number>>>>();
  /** O(1) id → array index lookup — avoids indexOf in filter hot paths */
  private readonly idxById = new Map<string, number>();
  /** Pre-built fuzzy search strings — built once, reused on every search */
  private readonly searchStrings: string[] = [];

  constructor(data = [] as SearchData[], debug = false) {
    this.data = alphabetical(data, (i) => i.name);
    this.debug = debug;

    this.state = writableDeep<SearchState>({
      showLocation: true
    });
    this.fuzzy = new Fuzzy();
    this.ids = this.data.map((i) => i.id);

    // Build id→index map for O(1) lookups in filter methods
    this.data.forEach((record, idx) => {
      this.idxById.set(record.id, idx);
    });

    // Pre-build fuzzy search corpus once — data is immutable after construction
    this.searchStrings = this.data.map(
      (i) =>
        `${i.name} ${i.flavor} ${i.id} ${i.location?.city?.name} ${i.location?.state?.name} ${i.location?.country?.name}`
    );

    this._buildIndexes();

    this.results = derived(this.state, (state) => {
      let resultIds = [...this.ids];

      // Filter by Location
      if (state.searchLocation && !isEmpty(state.searchLocation)) {
        const { city: filterCity, country: filterCountry, state: filterState } = state.searchLocation;
        const locationIds = this.data
          .filter((record) => {
            const { city, country, state: recordState } = record.location as LocationMeta;
            const cityMatch = !filterCity || (city && city.id === filterCity.id);
            const countryMatch = !filterCountry || (country && country.id === filterCountry.id);
            const stateMatch = !filterState || (recordState && recordState.id === filterState.id);

            return cityMatch && countryMatch && stateMatch;
          })
          .map((i) => i.id);
        const locationIdSet = new Set(locationIds);
        resultIds = resultIds.filter((i) => locationIdSet.has(i));
      }

      // Filter by Search Text — uses pre-built corpus, no per-call allocation
      if (state.searchTerms && !isEmpty(state.searchTerms)) {
        const searchIds =
          this.fuzzy
            ?.filter(this.searchStrings, (state.searchTerms as string)?.toLowerCase())
            ?.map((i) => this.data[i].id) || [];
        const searchIdSet = new Set(searchIds);
        resultIds = resultIds.filter((i) => searchIdSet.has(i));
      }

      // Apply All Other Filters
      resultIds = this.applyAllFilters(state, resultIds);

      const resultIdSet = new Set(resultIds);
      return alphabetical(
        this.data.filter((record) => resultIdSet.has(record.id)),
        (i) => i.name
      );
    });

    this.setSearchTerms = this.setSearchTerms.bind(this);
    this.setSearchLocation = this.setSearchLocation.bind(this);
    this.setFilters = this.setFilters.bind(this);
    this.resetSearchTerms = this.resetSearchTerms.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.resetLocation = this.resetLocation.bind(this);
    this.resetAll = this.resetAll.bind(this);
    this.toggleLocation = this.toggleLocation.bind(this);
  }

  adminFilter(filters: Record<string, boolean>, currentIds: string[]) {
    const activeFilters = shake(filters, (f) => !f);
    if (isEmpty(activeFilters)) {
      return currentIds;
    }

    let ids: string[] = [];

    if (activeFilters.unapproved) {
      ids = this.data.filter((record) => !record.visible).map((i) => i.id);
    }

    if (activeFilters.unclaimed) {
      const unclaimedIds = this.data.filter((record) => !record.owner).map((i) => i.id);
      ids = isEmpty(ids) ? unclaimedIds : ids.filter((id) => unclaimedIds.includes(id));
    }

    return currentIds.filter((i) => ids.includes(i));
  }

  applyAllFilters(state: SearchState, currentIds: string[]) {
    const hasFilter = (filters: Record<string, boolean>): boolean => {
      if (!filters || isEmpty(filters)) {
        return false;
      }
      return Object.values(filters).some((f) => f === true);
    };

    if (!state.filters || isEmpty(state.filters)) {
      return currentIds;
    }

    let resultIds = [...currentIds];
    const { accessibility, admin, denomination, health, registration, security, services } = state.filters;

    if (hasFilter(services)) {
      resultIds = this.boolFilter('services', services, resultIds);
    }
    if (hasFilter(security)) {
      resultIds = this.boolFilter('security', security, resultIds);
    }
    if (hasFilter(accessibility)) {
      resultIds = this.boolFilter('accessibility', accessibility, resultIds);
    }
    if (hasFilter(denomination)) {
      resultIds = this.stringFilter('denomination', 'denomination', denomination, resultIds);
    }
    if (hasFilter(health)) {
      resultIds = this.stringFilter('health', 'protocol', health, resultIds);
    }
    if (hasFilter(registration)) {
      resultIds = this.stringFilter('registration', 'registrationType', registration, resultIds);
    }
    if (hasFilter(admin)) {
      resultIds = this.adminFilter(admin, resultIds);
    }

    return resultIds;
  }

  boolFilter(filter: string, filters: object, currentIds: string[]) {
    const activeFilters = shake(filters, (f) => !f);
    if (isEmpty(activeFilters)) {
      return currentIds;
    }

    const keyMap = this.boolIndex.get(filter);
    if (!keyMap) {
      return currentIds;
    }

    const matchedIdx = new Set<number>();
    for (const key of Object.keys(activeFilters)) {
      const idxSet = keyMap.get(key);
      if (idxSet) {
        for (const idx of idxSet) {
          matchedIdx.add(idx);
        }
      }
    }

    return currentIds.filter((id) => {
      const idx = this.idxById.get(id) ?? -1;
      return idx >= 0 && matchedIdx.has(idx);
    });
  }

  resetAll() {
    this.state.setKey('searchTerms', '');
    this.state.setKey('searchLocation', {});
    this.state.setKey('filters', {});
  }

  resetFilters() {
    this.state.setKey('filters', {});
  }

  resetLocation() {
    this.state.setKey('searchLocation', {});
  }

  resetSearchTerms() {
    this.state.setKey('searchTerms', '');
  }

  setFilters(filters: SearchState['filters']) {
    this.state.setKey('filters', filters);
  }

  setSearchLocation(searchLocation: LocationMeta) {
    this.state.setKey('searchLocation', searchLocation);
  }

  setSearchTerms(searchTerms: string) {
    this.state.setKey('searchTerms', searchTerms);
  }

  stringFilter(filter: string, targetKey: string, filters: object, currentIds: string[]) {
    const activeFilters = shake(filters, (f) => !f);
    if (isEmpty(activeFilters)) {
      return currentIds;
    }

    const map = this.stringIndex.get(filter);
    if (!map) {
      return currentIds;
    }

    const valMap = map.get(targetKey);
    if (!valMap) {
      return currentIds;
    }

    const matchedIdx = new Set<number>();
    for (const key of Object.keys(activeFilters)) {
      const idxSet = valMap.get(key);
      if (idxSet) {
        for (const idx of idxSet) {
          matchedIdx.add(idx);
        }
      }
    }

    return currentIds.filter((id) => {
      const idx = this.idxById.get(id) ?? -1;
      return idx >= 0 && matchedIdx.has(idx);
    });
  }

  toggleLocation() {
    const state = this.state.get();
    this.state.setKey('showLocation', !state.showLocation);
  }

  /** Get or create a nested inner Map. */
  private _ensureInner<V>(outer: Map<string, V>, key: string, factory: () => V): V {
    let inner = outer.get(key);
    if (!inner) {
      inner = factory();
      outer.set(key, inner);
    }
    return inner;
  }

  /** Index a bool-typed child table record (services, security, accessibility). */
  private _indexBoolRecord(key: string, record: Record<string, unknown>, idx: number): void {
    const sub = record[key] as unknown as Record<string, unknown> | undefined;
    if (!sub) {
      return;
    }
    for (const subKey of Object.keys(sub)) {
      if (subKey === '__proto__' || subKey === 'constructor') {
        continue;
      }
      if (sub[subKey]) {
        const inner = this._ensureInner(this.boolIndex, key, () => new Map());
        const set = this._ensureInner(inner, subKey, () => new Set<number>());
        set.add(idx);
      }
    }
  }

  /** Index a string-typed child table value into the string index. */
  private _indexStringValue(filter: string, targetKey: string, val: string, idx: number): void {
    const map = this._ensureInner(this.stringIndex, filter, () => new Map());
    const valMap = this._ensureInner(map, targetKey, () => new Map<string, Set<number>>());
    const set = this._ensureInner(valMap, val, () => new Set<number>());
    set.add(idx);
  }

  /** Build lookup indexes so boolFilter/stringFilter don't scan all records. */
  private _buildIndexes(): void {
    this.data.forEach((record, idx) => {
      for (const key of ['services', 'security', 'accessibility'] as const) {
        this._indexBoolRecord(key, record as unknown as Record<string, unknown>, idx);
      }

      const denom = record.denomination;
      if (denom) {
        this._indexStringValue('denomination', 'denomination', denom, idx);
      }

      for (const filter of ['health', 'registration'] as const) {
        const sub = record[filter];
        if (!sub) {
          continue;
        }
        const targetKey = filter === 'health' ? 'protocol' : 'registrationType';
        const val = sub[targetKey as keyof typeof sub];
        if (val && typeof val === 'string') {
          this._indexStringValue(filter, targetKey, val, idx);
        }
      }
    });
  }
}
