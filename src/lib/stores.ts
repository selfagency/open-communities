/* region imports */
import type { MapStore } from 'nanostores';

import * as persistent from '@nanostores/persistent';
import { Country, State, City, type ICity, type IState, type ICountry } from 'country-state-city';
import { map } from 'nanostores';
import { assign } from 'radashi';

import type { UsersRecord, LocalesRecord } from '$lib/types';

import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
};

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

type LocaleOptions = {
	countryOptions: SelectOption[];
	stateOptions: SelectOption[];
	cityOptions: SelectOption[];
};

type Localities = {
	countries: ICountry[];
	states?: IState[];
	cities?: ICity[];
};

type Locality = {
	country?: ICountry;
	state?: IState;
	city?: ICity;
};

type LocaleState = {
	options: LocaleOptions;
	localities: Localities;
	locality: Locality;
	record: LocalesRecord;
};
/* endregion types */

/* region variables */
// constants
const { persistentMap } = persistent;

const encoder = {
	encode: JSON.stringify,
	decode: JSON.parse
};
/* endregion variables */

/* region state */
export const state = persistentMap<State>('state_', {} as State, encoder);

export const user = persistentMap<UsersRecord & { email: string }>(
	'user_',
	{} as UsersRecord & { email: string },
	encoder
);

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

		this.debug = debug;
	}

	toggleLocale() {
		const state = this.state.get();
		this.state.set({ ...state, showLocale: !state.showLocale });
		if (this.debug) log.debug('search:toggleLocale', this.state.get());
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
		this.state.set({ ...state, searchLocale: undefined });
		if (this.debug) log.debug('search:locale', this.state.get().searchLocale);
	}

	resetAll() {
		this.state.set({});
		if (this.debug) log.debug('search', this.state.get());
	}
}

export class Locale {
	state: MapStore<LocaleState>;
	default: LocaleState;
	countries: ICountry[];
	search?: Search;

	constructor(search?: Search) {
		if (search) this.search = search;
		this.countries = Country.getAllCountries();

		this.default = {
			locality: {},
			localities: { countries: this.countries },
			options: {
				countryOptions: this.countries.map((c) => ({
					label: c.name,
					value: `${c.name} (${c.isoCode})`
				}))
			},
			record: {}
		} as LocaleState;
		this.state = map<LocaleState>(this.default);

		this.setCountry = this.setCountry.bind(this);
		this.setState = this.setState.bind(this);
		this.setCity = this.setCity.bind(this);
		this.reset = this.reset.bind(this);
	}

	reset() {
		if (this.search) this.search.resetLocale();
		this.state.set(this.default);
	}

	setCountry(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const state = this.state.get();
		const country = this.countries?.find((c) => c.isoCode === input) as ICountry;
		const states = State.getStatesOfCountry(input);

		this.state.set({
			...state,
			locality: {
				country
			},
			localities: {
				countries: state.localities.countries,
				states,
				cities: []
			},
			options: {
				countryOptions: state.options.countryOptions,
				stateOptions: states.map((s) => ({
					label: s.name,
					value: `${s.name} (${s.isoCode})`
				})),
				cityOptions: []
			},
			record: {
				country: country?.name,
				state: undefined,
				city: undefined,
				latitude: country?.latitude as unknown as number,
				longitude: country?.longitude as unknown as number
			}
		});
	}

	setState(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const objState = this.state.get();
		const state = objState.localities?.states?.find((s) => s.isoCode === input);
		const cities = City.getCitiesOfState(objState.locality.country?.isoCode as string, input);

		this.state.set({
			...objState,
			locality: {
				country: objState.locality.country,
				state
			},
			localities: {
				...objState.localities,
				cities
			},
			options: {
				...objState.options,
				cityOptions: cities.map((c) => ({
					label: c.name,
					value: c.name
				}))
			},
			record: {
				country: objState.locality.country?.name,
				state: state?.name,
				city: undefined,
				latitude: state?.latitude as unknown as number,
				longitude: state?.longitude as unknown as number
			}
		});
	}

	setCity(input: string) {
		const objState = this.state.get();
		const { cities } = objState.localities;

		const city = cities?.find((c) => c.name === input) as ICity;

		this.state.set({
			...objState,
			locality: {
				...objState.locality,
				city
			},
			record: {
				country: objState.locality.country?.name,
				state: objState.locality.state?.name,
				city: city?.name,
				latitude: city?.latitude as unknown as number,
				longitude: city?.longitude as unknown as number
			}
		});
	}
}
/* endregion state */

/* region methods */
export function setState(newState: Partial<State>) {
	state.set(assign(state.get(), newState));
}

export function initState() {
	setState({
		showIntro: true
	});
}
/* endregion methods */
