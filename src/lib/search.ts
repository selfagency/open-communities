/* region imports */
import type { MapStore, ReadableAtom } from 'nanostores';

import Fuzzy from '@leeoniya/ufuzzy';
import { computed, map } from 'nanostores';
import { alphabetical, isEmpty, shake, unique } from 'radashi';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import type { LocationMeta, SearchData, SearchState } from '$lib/types.d';

// import { log } from '$lib/utils';
/* endregion imports */

export class Search {
	data: SearchData[];
	debug: boolean;
	fuzzy: Fuzzy;
	ids: string[];
	results: ReadableAtom<CongregationMetaRecord[]>;
	state: MapStore<SearchState>;

	constructor(data = [] as SearchData[], debug = false) {
		this.data = alphabetical(data, (i) => i.name);
		this.debug = debug;

		this.state = map<SearchState>({});
		this.fuzzy = new Fuzzy();
		this.ids = this.data.map((i) => i.id);

		this.results = computed(this.state, (state) => {
			let resultIds = [...this.ids];

			// Filter by Location
			if (state.searchLocation && !isEmpty(state.searchLocation)) {
				const {
					city: filterCity,
					country: filterCountry,
					state: filterState
				} = state.searchLocation;
				const locationIds = this.data
					.filter((record) => {
						const { city, country, state: recordState } = record.location as LocationMeta;

						// if (this.debug) {
						// 	console.log('Filter:', { filterCity, filterCountry, filterState });
						// 	console.log('Record:', { city, country, state: recordState });
						// }

						const cityMatch = !filterCity || (city && city.id === filterCity.id);
						const countryMatch = !filterCountry || (country && country.id === filterCountry.id);
						const stateMatch = !filterState || (recordState && recordState.id === filterState.id);

						return cityMatch && countryMatch && stateMatch;
					})
					.map((i) => i.id);
				resultIds = resultIds.filter((i) => locationIds.includes(i));
			}

			// Filter by Search Text
			if (state.searchTerms && !isEmpty(state.searchTerms)) {
				const searchIds =
					this.fuzzy
						?.filter(
							this.data.map((i) => `${i.name} ${i.flavor} ${i.id}`),
							(state.searchTerms as string)?.toLowerCase()
						)
						?.map((i) => this.data[i].id) || [];
				resultIds = resultIds.filter((i) => searchIds.includes(i));
			}

			// Apply All Other Filters
			resultIds = this.applyAllFilters(state, resultIds);

			return alphabetical(
				this.data.filter((record) => unique(resultIds).includes(record.id)),
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

	adminFilter(filters: object, currentIds: string[]) {
		const activeFilters = shake(filters, (f) => !f);
		if (isEmpty(activeFilters)) return currentIds;

		let ids: string[] = [];

		if (activeFilters['unapproved']) {
			ids = this.data.filter((record) => !record.visible).map((i) => i.id);
		}

		if (activeFilters['unclaimed']) {
			const unclaimedIds = this.data.filter((record) => !record.owner).map((i) => i.id);
			// If 'unapproved' was also checked, find the intersection. Otherwise, just use unclaimed.
			ids = !isEmpty(ids) ? ids.filter((id) => unclaimedIds.includes(id)) : unclaimedIds;
		}

		return currentIds.filter((i) => ids.includes(i));
	}

	applyAllFilters(state: SearchState, currentIds: string[]) {
		const hasFilter = (filters): boolean => {
			if (!filters || isEmpty(filters)) return false;
			return !isEmpty(shake(filters, (f) => (typeof f === 'boolean' ? f !== true : isEmpty(f))));
		};

		if (!state.filters || isEmpty(state.filters)) {
			return currentIds;
		}

		let resultIds = [...currentIds];
		const { accessibility, admin, denomination, health, registration, security, services } =
			state.filters;

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
		if (isEmpty(activeFilters)) return currentIds;

		const ids = this.data
			.filter((record) => {
				return Object.keys(activeFilters).some((key) => {
					return record[filter]?.[key];
				});
			})
			.map((i) => i.id);

		return currentIds.filter((i) => ids.includes(i));
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
		if (isEmpty(activeFilters)) return currentIds;

		const ids = this.data
			.filter((record) => {
				return Object.keys(activeFilters).some((key) => {
					return targetKey === 'denomination'
						? record[targetKey] === key
						: record[filter]?.[targetKey] === key;
				});
			})
			.map((i) => i.id);

		return currentIds.filter((i) => ids.includes(i));
	}

	toggleLocation() {
		const state = this.state.get();
		this.state.setKey('showLocation', !state.showLocation);
	}
}
