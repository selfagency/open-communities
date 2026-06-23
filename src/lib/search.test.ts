// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { Search } from './search';
import type { SearchData } from './types.d';

/* region fixtures */
function makeRecord(overrides: Partial<SearchData> & { id: string; name: string }): SearchData {
  return {
    accessibility: {},
    denomination: undefined,
    flavor: '',
    health: undefined,
    location: {},
    owner: undefined,
    registration: undefined,
    security: {},
    services: {},
    visible: true,
    ...overrides
  };
}

const RECORDS: SearchData[] = [
  makeRecord({
    accessibility: { inPerson_adaAll: true },
    denomination: 'reform',
    flavor: 'egalitarian',
    health: { protocol: 'maskingRequired' },
    id: 'a1',
    location: {
      city: { id: 'city-nyc', name: 'New York City' } as never,
      country: { id: 'country-us', name: 'United States' } as never,
      state: { id: 'state-ny', name: 'New York' } as never
    },
    name: 'Alpha Synagogue',
    owner: 'user-1',
    registration: { registrationType: 'free' },
    services: { inPerson: true }
  }),
  makeRecord({
    denomination: 'conservative',
    flavor: 'traditional',
    health: { protocol: 'noGuidelines' },
    id: 'b2',
    location: {
      country: { id: 'country-us', name: 'United States' } as never,
      state: { id: 'state-ca', name: 'California' } as never
    },
    name: 'Beta Congregation',
    registration: { registrationType: 'slidingScale' },
    security: { noFirearms: true },
    services: { onlineOnly: true }
  }),
  makeRecord({
    denomination: 'reform',
    flavor: 'progressive',
    id: 'c3',
    location: {
      city: { id: 'city-chi', name: 'Chicago' } as never,
      country: { id: 'country-us', name: 'United States' } as never,
      state: { id: 'state-il', name: 'Illinois' } as never
    },
    name: 'Gamma Kehillah',
    owner: undefined,
    visible: false
  }),
  makeRecord({
    id: 'd4',
    location: { country: { id: 'country-ca', name: 'Canada' } as never },
    name: 'Delta Minyan',
    visible: true
  })
];
/* endregion fixtures */

describe('Search', () => {
  describe('constructor', () => {
    it('sorts data alphabetically by name', () => {
      const s = new Search(RECORDS);
      const names = s.data.map((r) => r.name);
      expect(names).toEqual([...names].sort());
    });

    it('builds idxById map with correct length', () => {
      const s = new Search(RECORDS);
      // Access private via cast for testing
      const idx = (s as never as { idxById: Map<string, number> }).idxById;
      expect(idx.size).toBe(RECORDS.length);
      for (const r of RECORDS) {
        expect(idx.has(r.id)).toBe(true);
      }
    });

    it('pre-builds searchStrings with same length as data', () => {
      const s = new Search(RECORDS);
      const ss = (s as never as { searchStrings: string[] }).searchStrings;
      expect(ss).toHaveLength(RECORDS.length);
    });

    it('initializes with all records in results', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      })();
      expect(results).toHaveLength(RECORDS.length);
    });
  });

  describe('setSearchTerms / resetSearchTerms', () => {
    it('filters results by name text', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchTerms('alpha');
      expect(results.map((r) => r.id)).toContain('a1');
      expect(results.map((r) => r.id)).not.toContain('b2');
      unsub();
    });

    it('returns all results when searchTerms reset to empty', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchTerms('alpha');
      s.resetSearchTerms();
      expect(results).toHaveLength(RECORDS.length);
      unsub();
    });
  });

  describe('setSearchLocation / resetLocation', () => {
    it('filters by country', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchLocation({ country: { id: 'country-ca', name: 'Canada' } } as never);
      expect(results.map((r) => r.id)).toEqual(['d4']);
      unsub();
    });

    it('filters by state within country', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchLocation({
        country: { id: 'country-us', name: 'United States' },
        state: { id: 'state-ny', name: 'New York' }
      } as never);
      expect(results.map((r) => r.id)).toEqual(['a1']);
      unsub();
    });

    it('returns all results after resetLocation', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchLocation({ country: { id: 'country-ca', name: 'Canada' } } as never);
      s.resetLocation();
      expect(results).toHaveLength(RECORDS.length);
      unsub();
    });
  });

  describe('boolFilter — services', () => {
    it('returns only records with inPerson=true when filter active', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ services: { inPerson: true } });
      expect(results.map((r) => r.id)).toEqual(['a1']);
      unsub();
    });

    it('returns only records with onlineOnly=true when filter active', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ services: { onlineOnly: true } });
      expect(results.map((r) => r.id)).toEqual(['b2']);
      unsub();
    });
  });

  describe('boolFilter — accessibility', () => {
    it('returns only ADA-accessible records', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ accessibility: { inPerson_adaAll: true } });
      expect(results.map((r) => r.id)).toEqual(['a1']);
      unsub();
    });
  });

  describe('stringFilter — denomination', () => {
    it('returns only reform congregations', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ denomination: { reform: true } });
      const ids = results.map((r) => r.id);
      expect(ids).toContain('a1');
      expect(ids).toContain('c3');
      expect(ids).not.toContain('b2');
      unsub();
    });

    it('returns only conservative congregations', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ denomination: { conservative: true } });
      expect(results.map((r) => r.id)).toEqual(['b2']);
      unsub();
    });
  });

  describe('stringFilter — health protocol', () => {
    it('returns masking-required records', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ health: { maskingRequired: true } });
      expect(results.map((r) => r.id)).toEqual(['a1']);
      unsub();
    });
  });

  describe('stringFilter — registration type', () => {
    it('returns free-registration records', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ registration: { free: true } });
      expect(results.map((r) => r.id)).toEqual(['a1']);
      unsub();
    });
  });

  describe('adminFilter', () => {
    it('returns unapproved (visible=false) records', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ admin: { unapproved: true } });
      expect(results.map((r) => r.id)).toEqual(['c3']);
      unsub();
    });

    it('returns unclaimed (no owner) records', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setFilters({ admin: { unclaimed: true } });
      const ids = results.map((r) => r.id);
      expect(ids).toContain('c3');
      expect(ids).toContain('d4');
      expect(ids).not.toContain('a1');
      unsub();
    });
  });

  describe('combined filters', () => {
    it('combines text search and denomination filter', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchTerms('gamma');
      s.setFilters({ denomination: { reform: true } });
      expect(results.map((r) => r.id)).toEqual(['c3']);
      unsub();
    });
  });

  describe('resetAll', () => {
    it('clears all active filters and search terms', () => {
      const s = new Search(RECORDS);
      let results: SearchData[] = [];
      const unsub = s.results.subscribe((r) => {
        results = r as unknown as SearchData[];
      });
      s.setSearchTerms('alpha');
      s.setFilters({ denomination: { reform: true } });
      s.resetAll();
      expect(results).toHaveLength(RECORDS.length);
      unsub();
    });
  });

  describe('idxById O(1) lookup integrity', () => {
    it('every id maps to the correct index in this.data', () => {
      const s = new Search(RECORDS);
      const idx = (s as never as { idxById: Map<string, number> }).idxById;
      for (const [id, i] of idx) {
        expect(s.data.at(i)?.id).toBe(id);
      }
    });
  });
});
