/* region imports */
import type { MapStore } from 'nanostores';

import { map } from 'nanostores';

import { api } from '$lib/api';
import { state as appState } from '$lib/stores';
import { log } from '$lib/utils';

import type { CountriesRecord, StatesRecord, CitiesRecord, TypedPocketBase } from './types';

import { Search } from './search';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
};

type LocationOptions = {
	countryOptions: SelectOption[];
	stateOptions: SelectOption[];
	cityOptions: SelectOption[];
};

type Localities = {
	countries: CountriesRecord[];
	states?: StatesRecord[];
	cities?: CitiesRecord[];
};

type Locality = {
	country?: CountriesRecord;
	state?: StatesRecord;
	city?: CitiesRecord;
};

export type LocationRecord = {
	country?: string;
	state?: string;
	city?: string;
	longitude?: number;
	latitude?: number;
};

export type LocationMeta = {
	country: CountriesRecord;
	state: StatesRecord;
	city: CitiesRecord;
};

type LocationState = {
	options: LocationOptions;
	localities: Localities;
	locality: Locality;
	record: LocationRecord;
};
/* endregion types */

export class Location {
	state: MapStore<LocationState>;
	default: LocationState;
	countries: CountriesRecord[];
	search?: Search;
	api?: TypedPocketBase;

	constructor(search?: Search) {
		if (search) this.search = search;
		this.api = api;

		this.countries = appState.get().countries as CountriesRecord[];

		this.default = {
			locality: {},
			localities: { countries: this.countries },
			options: {
				countryOptions: this.countries?.map((c) => ({
					label: c.name,
					value: `${c.name} (${c.code})`
				}))
			},
			record: {}
		} as LocationState;
		this.state = map<LocationState>(this.default);

		this.setCountry = this.setCountry.bind(this);
		this.setState = this.setState.bind(this);
		this.setCity = this.setCity.bind(this);
		this.reset = this.reset.bind(this);
		this.load = this.load.bind(this);
	}

	load(record: LocationRecord) {
		let objState = this.state.get();

		const country = this.countries?.find((c) => c.name === record.country);
		this.setCountry(`(${country?.code})`);

		objState = this.state.get();
		const state = objState.localities.states?.find((s) => s.name === record.state);
		this.setState(`(${state?.code})`);

		objState = this.state.get();
		const city = objState.localities.cities?.find((c) => c.name === record.city);
		this.setCity(city?.name as string);

		return {
			city: city?.name,
			country: `${country?.name} (${country?.code})`,
			state: `${state?.name} (${state?.code})`,
			latitude: city?.latitude || state?.latitude || country?.latitude,
			longitude: city?.longitude || state?.longitude || country?.longitude
		};
	}

	reset() {
		this.state.set(this.default);
		if (this.search) this.search.resetLocation();
	}

	async setCountry(input: string) {
		input = input.split('(')[1].slice(0, -1);

		const state = this.state.get();
		const country = this.countries?.find((c) => c.code === input) as CountriesRecord & {
			id: string;
		};

		const api = this.api as TypedPocketBase;

		let states: StatesRecord[] = [];
		try {
			states = await api?.collection('states')?.getFullList({
				filter: `country="${country.id}"`
			});

			if (states)
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
						stateOptions: states?.map((s) => ({
							label: s.name as string,
							value: `${s.name} (${s.code})`
						})),
						cityOptions: []
					},
					record: {
						country: country?.name,
						state: undefined,
						city: undefined,
						latitude: country?.latitude,
						longitude: country?.longitude
					}
				});
		} catch (err) {
			log.error(err);
		}
	}

	async setState(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const objState = this.state.get();
		const state = objState.localities?.states?.find((s) => s.code === input) as StatesRecord & {
			id: string;
		};
		const api = this.api as TypedPocketBase;

		let cities: CitiesRecord[] = [];
		try {
			cities = await api?.collection('cities')?.getFullList({
				filter: `state="${state?.id}"`
			});

			if (cities)
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
						cityOptions: cities?.map((c) => ({
							label: c.name as string,
							value: c.name as string
						}))
					},
					record: {
						country: objState.locality.country?.name,
						state: state?.name,
						city: undefined,
						latitude: state?.latitude,
						longitude: state?.longitude
					}
				});
		} catch (err) {
			log.error(err);
		}
	}

	setCity(input: string) {
		const objState = this.state.get();
		const { cities } = objState.localities;

		const city = cities?.find((c) => c.name === input) as CitiesRecord;

		if (city)
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
					latitude: city?.latitude,
					longitude: city?.longitude
				}
			});
	}
}
