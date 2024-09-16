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
export type SelectOption = { label: string; value: string; id: string };

export type Country = CountriesRecord & { id: string };
export type State = StatesRecord & { id: string };
export type City = CitiesRecord & { id: string };

type LocationOptions = {
	countryOptions: SelectOption[];
	stateOptions: SelectOption[];
	cityOptions: SelectOption[];
};

type Localities = {
	countries: Country[];
	states?: State[];
	cities?: City[];
};

type Locality = {
	country?: Country;
	state?: State;
	city?: City;
};

export type LocationRecord = {
	country?: string;
	state?: string;
	city?: string;
	longitude?: number;
	latitude?: number;
};

export type LocationMeta = {
	country?: Country;
	state?: State;
	city?: City;
	longitude?: number;
	latitude?: number;
};

type LocationState = {
	options: LocationOptions;
	localities: Localities;
	locality: Locality;
	record: LocationMeta;
};
/* endregion types */

export class Location {
	state: MapStore<LocationState>;
	default: LocationState;
	countries: Country[];
	search?: Search;
	api?: TypedPocketBase;

	constructor(search?: Search) {
		if (search) this.search = search;
		this.api = api;

		this.countries = appState.get().countries as Country[];

		this.default = {
			locality: {},
			localities: { countries: this.countries },
			options: {
				countryOptions: this.countries?.map((c) => ({
					label: c?.name,
					value: `${c?.name} (${c?.code})`,
					id: c?.id
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

	async load(record: LocationRecord) {
		if (record.country) {
			await this.setCountry(record.country);

			if (record.state) {
				await this.setState(record.state);

				if (record.city) {
					this.setCity(record.city);
				}
			}
		}
	}

	reset() {
		this.state.set(this.default);
		if (this.search) this.search.resetLocation();
	}

	async setCountry(input: string) {
		const state = this.state.get();
		const country = this.countries?.find((c) => c?.id === input) as Country;
		const api = this.api as TypedPocketBase;

		let states: State[] = [];
		try {
			states = await api?.collection('states')?.getFullList({
				filter: `country="${country?.id}"`
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
							label: s?.name as string,
							value: `${s?.name} (${s.code})`,
							id: s?.id
						})),
						cityOptions: []
					},
					record: {
						country,
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
		const objState = this.state.get();
		const state = objState.localities?.states?.find((s) => s?.id === input) as State;
		const api = this.api as TypedPocketBase;

		let cities: City[] = [];
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
							label: c?.name as string,
							value: c?.name as string,
							id: c?.id
						}))
					},
					record: {
						country: objState.locality.country as Country,
						state: state as State,
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

		const city = cities?.find((c) => c?.id === input) as City;

		if (city)
			this.state.set({
				...objState,
				locality: {
					...objState.locality,
					city
				},
				record: {
					country: objState.locality.country as Country,
					state: objState.locality.state as State,
					city: city as City,
					latitude: city?.latitude,
					longitude: city?.longitude
				}
			});
	}
}
