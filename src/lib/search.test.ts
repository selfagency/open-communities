import { beforeEach, describe, expect, it } from 'vitest';

import type { LocationMeta, SearchData, SearchState } from './types.d';

import { Search } from './search';

// Helper to build minimal SearchData records; extras may include runtime-only keys
function makeRec(id: string, name: string, extras: Record<string, unknown> = {}) {
	// Property order follows `SearchData` declaration: flavor?, id, location?, name, owner?, visible
	const base = {
		flavor: '',
		id,
		location: (extras.location as LocationMeta | undefined) ?? undefined,
		name,
		owner: (extras.owner as string | undefined) ?? undefined,
		visible: (extras.visible as boolean) ?? true,
		// include any runtime-only fields after the core keys
		...extras
	} as Record<string, unknown> & SearchData;

	return base;
}

let data: SearchData[];

beforeEach(() => {
	data = [
		makeRec('a', 'Alpha', {
			accessibility: { inPerson_adaAll: true },
			denomination: 'reform',
			health: { protocol: 'maskingRecommended' },
			location: {
				city: { id: 'city1' },
				country: { id: 'ct1' },
				state: { id: 's1' }
			} as LocationMeta,
			owner: 'owner1',
			registration: { registrationType: 'free' },
			security: { noFirearms: true },
			services: { inPerson: true }
		}),
		makeRec('b', 'Beta', {
			denomination: 'orthodox',
			location: {
				city: { id: 'city2' },
				country: { id: 'ct1' },
				state: { id: 's2' }
			} as LocationMeta,
			services: { onlineOnly: true },
			visible: false
		}),
		makeRec('c', 'Chi', {
			denomination: 'reform',
			location: {
				city: { id: 'city1' },
				country: { id: 'ct2' },
				state: { id: 's1' }
			} as LocationMeta,
			services: { inPerson: true, onlineOnly: false },
			visible: false
		})
	];
});

describe('Search filters', () => {
	it('adminFilter filters unapproved and unclaimed correctly', () => {
		const s = new Search(data, true);
		const allIds = data.map((d) => d.id);

		// unapproved -> visible === false (b and c)
		const adminUnapproved: Record<string, boolean> = { unapproved: true };
		const unapproved = s.adminFilter(adminUnapproved, allIds);
		expect(unapproved.sort()).toEqual(['b', 'c']);

		// unclaimed -> owner falsy (b and c)
		const adminUnclaimed: Record<string, boolean> = { unclaimed: true };
		const unclaimed = s.adminFilter(adminUnclaimed, allIds);
		expect(unclaimed.sort()).toEqual(['b', 'c']);

		// both -> intersection -> b and c (both unapproved and unclaimed)
		const adminBoth: Record<string, boolean> = { unapproved: true, unclaimed: true };
		const both = s.adminFilter(adminBoth, allIds);
		expect(both.sort()).toEqual(['b', 'c']);
	});

	it('boolFilter filters by nested boolean properties (services/security/accessibility)', () => {
		const s = new Search(data, true);
		const allIds = data.map((d) => d.id);

		// services.inPerson -> records a and c
		const servicesFilter: Record<string, boolean> = { inPerson: true };
		const inPerson = s.boolFilter('services', servicesFilter, allIds);
		expect(inPerson.sort()).toEqual(['a', 'c']);

		// security.noFirearms -> record a only
		const securityFilter: Record<string, boolean> = { noFirearms: true };
		const sec = s.boolFilter('security', securityFilter, allIds);
		expect(sec).toEqual(['a']);

		// accessibility.inPerson_adaAll -> a only
		const accessibilityFilter: Record<string, boolean> = { inPerson_adaAll: true };
		const acc = s.boolFilter('accessibility', accessibilityFilter, allIds);
		expect(acc).toEqual(['a']);
	});

	it('stringFilter filters denomination and other string-targeted keys', () => {
		const s = new Search(data, true);
		const allIds = data.map((d) => d.id);

		// denomination: 'reform' -> a and c
		const denomFilter: Record<string, boolean> = { reform: true };
		const denom = s.stringFilter('denomination', 'denomination', denomFilter, allIds);
		expect(denom.sort()).toEqual(['a', 'c']);

		// registration.registrationType -> only 'a' has registration.free
		const regFilter: Record<string, boolean> = { free: true };
		const reg = s.stringFilter('registration', 'registrationType', regFilter, allIds);
		expect(reg).toEqual(['a']);
	});

	it('applyAllFilters composes filters and returns matching ids', () => {
		const s = new Search(data, true);
		const allIds = data.map((d) => d.id);

		const state: SearchState = {
			filters: {
				admin: { unapproved: true },
				services: { inPerson: true }
			}
		};

		// services inPerson -> a and c, admin unapproved -> b and c => intersection -> c
		const out = s.applyAllFilters(state, allIds);
		expect(out).toEqual(['c']);
	});

	it('toggleLocation and resetAll mutate state correctly', () => {
		const s = new Search(data, true);

		// initial showLocation undefined -> toggle -> true
		s.toggleLocation();
		expect(s.state.get().showLocation).toBe(true);

		// toggle again -> false
		s.toggleLocation();
		expect(s.state.get().showLocation).toBe(false);

		// set a searchLocation and terms, then resetAll
		const loc: LocationMeta = { city: { id: 'city1' } };
		s.setSearchLocation(loc);
		s.setSearchTerms('alpha');
		const setFiltersVal: SearchState['filters'] = { services: { inPerson: true } };
		s.setFilters(setFiltersVal);

		s.resetAll();
		expect(s.state.get().searchTerms).toBe('');
		expect(s.state.get().searchLocation).toEqual({});
		expect(s.state.get().filters).toEqual({});
	});
});
