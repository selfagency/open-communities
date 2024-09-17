/* region imports */
import type { MapStore } from 'nanostores';

import Fuzzy from '@leeoniya/ufuzzy';
import { map } from 'nanostores';
import { isEmpty, unique, alphabetical, shake } from 'radashi';

import type { LocationMeta } from '$lib/location';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

type SearchState = {
	searchTerms?: string;
	searchLocation?: LocationMeta;
	showLocation?: boolean;
	filters?: {
		[key: string]: {
			[key: string]: boolean;
		};
	};
};
/* endregion types */

export class Search {
	state: MapStore<SearchState>;
	debug: boolean;
	data: any[];
	ids: string[];
	resultIds: string[];
	results: MapStore<any[]>;
	fuzzy: Fuzzy;

	constructor(data: any[] = [], debug = false) {
		this.data = alphabetical(data, (i) => i.name);
		this.debug = debug;

		this.state = map<SearchState>();
		this.results = map<any[]>();
		this.fuzzy = new Fuzzy();

		this.ids = this.data.map((i) => i.id);
		this.resultIds = this.ids;
		this.results.set(this.data);

		this.state.subscribe(() => {
			// if (this.debug) log.debug('search:state:terms', this.state.get().searchTerms);

			this.resultIds = this.ids;
			this.results.set(this.data);

			this.filterByLocation();
			this.searchText();
			this.applyFilters();

			this.results.set(
				alphabetical(
					this.data.filter((record) => unique(this.resultIds).includes(record.id)),
					(i) => i.name
				)
			);

			// if (this.debug) log.debug('search:state:resultIds', this.resultIds);
			// if (this.debug) log.debug('search:state:results', this.results.get().length);
		});

		this.setSearchTerms = this.setSearchTerms.bind(this);
		this.setSearchLocation = this.setSearchLocation.bind(this);
		this.setFilters = this.setFilters.bind(this);
		this.resetSearchTerms = this.resetSearchTerms.bind(this);
		this.resetFilters = this.resetFilters.bind(this);
		this.resetLocation = this.resetLocation.bind(this);
		this.resetAll = this.resetAll.bind(this);
		this.toggleLocation = this.toggleLocation.bind(this);
		this.searchText = this.searchText.bind(this);
	}

	filterByLocation() {
		const stateObj = this.state.get();
		if (!stateObj.searchLocation || isEmpty(stateObj.searchLocation)) return;

		const {
			city: filterCity,
			country: filterCountry,
			state: filterState
		} = stateObj.searchLocation as LocationMeta;

		const ids = this.data
			.filter((record) => {
				const { city, country, state } = record.location;

				return (
					(filterCity ? city.id === filterCity.id : true) &&
					(filterCountry ? country.id === filterCountry.id : true) &&
					(filterState ? state.id === filterState.id : true)
				);
			})
			.map((i) => i.id);

		this.resultIds = this.resultIds.filter((i) => ids.includes(i));
	}

	searchText() {
		const state = this.state.get();
		if (!state.searchTerms || isEmpty(state.searchTerms)) return;

		const ids =
			this.fuzzy
				?.filter(
					this.data.map((i) => `${i.name} ${i.flavor}`),
					(state.searchTerms as string)?.toLowerCase()
				)
				?.map((i) => this.data[i].id) || [];

		this.resultIds = this.resultIds.filter((i) => ids.includes(i));
	}

	boolFilter(filter: string) {
		const state = this.state.get();
		const filters = shake(state.filters?.[filter], (f) => !f);
		if (isEmpty(filters)) return;

		const ids = this.data
			.filter((record) => {
				return Object.keys(filters).some((key) => {
					return record[filter]?.[key];
				});
			})
			.map((i) => i.id);

		// if (this.debug) log.debug('search:filters:bool', filter, ids);
		this.resultIds = this.resultIds.filter((i) => ids.includes(i));
	}

	adminFilter() {
		const state = this.state.get();
		const filters = shake(state.filters?.admin, (f) => !f);
		if (isEmpty(filters)) return;

		let ids: string[] = [];

		if (filters['unapproved']) {
			ids = this.data.filter((record) => !record.visible).map((i) => i.id);
		}

		if (filters['unclaimed']) {
			ids = this.data.filter((record) => !record.owner).map((i) => i.id);
		}

		// if (this.debug) log.debug('search:filters:admin', filters, ids);
		this.resultIds = this.resultIds.filter((i) => ids.includes(i));
	}

	stringFilter(filter: string, targetKey: string) {
		const state = this.state.get();
		const filters = shake(state.filters?.[filter], (f) => !f);
		if (isEmpty(filters)) return;

		const ids = this.data
			.filter((record) => {
				return Object.keys(filters).some((key) => {
					return record[filter][targetKey] === key;
				});
			})
			.map((i) => i.id);

		// if (this.debug) log.debug('search:filters:string', filter, targetKey, ids);
		this.resultIds = this.resultIds.filter((i) => ids.includes(i));
	}

	applyFilters() {
		const state = this.state.get();

		const hasFilter = (filters: any, filter: string): boolean => {
			if (!filters || isEmpty(filters)) return false;
			// if (this.debug) log.debug(`search:filters:${filter}`, filters);
			return !isEmpty(shake(filters, (f) => !f));
		};

		const hasServices = hasFilter(state.filters?.services, 'services');
		const hasAccessibility = hasFilter(state.filters?.accessibility, 'accessibility');
		const hasHealth = hasFilter(state.filters?.health, 'health');
		const hasRegistration = hasFilter(state.filters?.registration, 'registration');
		const hasAdmin = hasFilter(state.filters?.admin, 'admin');

		if (
			!state.filters ||
			isEmpty(state.filters) ||
			(!hasServices && !hasAccessibility && !hasHealth && !hasRegistration && !hasAdmin)
		) {
			return;
		}

		if (hasServices) {
			this.boolFilter('services');
		}

		if (hasAccessibility) {
			this.boolFilter('accessibility');
		}

		if (hasHealth) {
			this.stringFilter('health', 'protocol');
		}

		if (hasRegistration) {
			this.stringFilter('registration', 'registrationType');
		}

		if (hasAdmin) {
			this.adminFilter();
		}
	}

	toggleLocation() {
		const state = this.state.get();
		this.state.set({
			...state,
			showLocation: !state.showLocation
		});
		// if (this.debug) log.debug('search:toggleLocation', this.state.get().showLocation);
	}

	setSearchTerms(searchTerms: string) {
		const state = this.state.get();
		this.state.set({ ...state, searchTerms });
		// if (this.debug) log.debug('search:terms', this.state.get().searchTerms);
	}

	setSearchLocation(searchLocation: LocationMeta) {
		const state = this.state.get();
		this.state.set({ ...state, searchLocation });
		// if (this.debug) log.debug('search:location', this.state.get().searchLocation);
	}

	setFilters(filters: SearchState['filters']) {
		const state = this.state.get();
		this.state.set({ ...state, filters });
		// if (this.debug) log.debug('search:filters', this.state.get().filters);
	}

	resetSearchTerms() {
		const state = this.state.get();
		this.state.set({ ...state, searchTerms: '' });
		// if (this.debug) log.debug('search:terms', this.state.get().searchTerms);
	}

	resetFilters() {
		const state = this.state.get();
		this.state.set({ ...state, filters: {} });
		// if (this.debug) log.debug('search:filters', this.state.get().filters);
	}

	resetLocation() {
		const state = this.state.get();
		this.state.set({ ...state, searchLocation: {} });
		// if (this.debug) log.debug('search:location', this.state.get().searchLocation);
	}

	resetAll() {
		this.state.set({});
		// if (this.debug) log.debug('search', this.state.get());
	}
}
