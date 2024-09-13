/* region imports */
import type { MapStore } from 'nanostores';

import Fuzzy from '@leeoniya/ufuzzy';
import { map } from 'nanostores';
import { isEmpty, crush } from 'radashi';

import type { LocalesRecord } from '$lib/types';

import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

type SearchState = {
	searchTerms?: string;
	searchLocale?: LocalesRecord;
	showLocale?: boolean;
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

	constructor(debug = false) {
		this.state = map<SearchState>();

		this.setSearchTerms = this.setSearchTerms.bind(this);
		this.setSearchLocale = this.setSearchLocale.bind(this);
		this.setFilters = this.setFilters.bind(this);
		this.resetSearchTerms = this.resetSearchTerms.bind(this);
		this.resetFilters = this.resetFilters.bind(this);
		this.resetLocale = this.resetLocale.bind(this);
		this.resetAll = this.resetAll.bind(this);
		this.toggleLocale = this.toggleLocale.bind(this);
		this.searchText = this.searchText.bind(this);

		this.debug = debug;
	}

	searchText(data: any[]) {
		const state = this.state.get();
		if (!data || data?.length === 0) return [];
		if (!state.searchTerms || state.searchTerms?.length === 0) return data;
		const fuzzy = new Fuzzy();
		const filtered =
			fuzzy?.filter(
				data.map((i) => JSON.stringify(i)),
				state.searchTerms.toLowerCase()
			) ?? [];
		return filtered.map((i) => data[i]);
	}

	applyFilters(data: any[]) {
		const state = this.state.get();
		const results = data;

		if (isEmpty(state.filters)) return results;

		const filters = crush(state.filters).filter((i) => i === true);
	}

	filterByLocale(data: any[]) {}

	toggleLocale() {
		this.resetLocale();
		const state = this.state.get();
		this.state.set({
			...state,
			showLocale: !state.showLocale
		});
		if (this.debug) log.debug('search:toggleLocale', this.state.get().showLocale);
	}

	setSearchTerms(searchTerms: string) {
		const state = this.state.get();
		this.state.set({ ...state, searchTerms });
		if (this.debug) log.debug('search:terms', this.state.get().searchTerms);
	}

	setSearchLocale(searchLocale: LocalesRecord) {
		const state = this.state.get();
		this.state.set({ ...state, searchLocale });
		if (this.debug) log.debug('search:locale', this.state.get().searchLocale);
	}

	setFilters(filters: SearchState['filters']) {
		const state = this.state.get();
		this.state.set({ ...state, filters });
		if (this.debug) log.debug('search:filters', this.state.get().filters);
	}

	resetSearchTerms() {
		const state = this.state.get();
		this.state.set({ ...state, searchTerms: '' });
		if (this.debug) log.debug('search:terms', this.state.get().searchTerms);
	}

	resetFilters() {
		const state = this.state.get();
		this.state.set({ ...state, filters: {} });
		if (this.debug) log.debug('search:filters', this.state.get().filters);
	}

	resetLocale() {
		const state = this.state.get();
		this.state.set({ ...state, searchLocale: {} });
		if (this.debug) log.debug('search:locale', this.state.get().searchLocale);
	}

	resetAll() {
		this.state.set({});
		if (this.debug) log.debug('search', this.state.get());
	}
}
