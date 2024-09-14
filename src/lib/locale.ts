/* region imports */
import type { MapStore } from 'nanostores';

import { type ICity, type IState, type ICountry } from 'country-state-city';
import { map } from 'nanostores';

import { PUBLIC_GEO_API_KEY, PUBLIC_GEO_API_ENDPOINT } from '$env/static/public';
import { state as appState } from '$lib/stores';
import { log } from '$lib/utils';

import type { LocalesRecord } from './types';

import { Search } from './search';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
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

export class Locale {
	state: MapStore<LocaleState>;
	default: LocaleState;
	countries: ICountry[];
	search?: Search;

	constructor(search?: Search) {
		if (search) this.search = search;

		this.countries = appState.get().countries as ICountry[];
		log.debug('countries', this.countries);
		this.default = {
			locality: {},
			localities: { countries: this.countries },
			options: {
				countryOptions: this.countries?.map((c) => ({
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
		this.load = this.load.bind(this);
	}

	load(record: LocalesRecord) {
		let objState = this.state.get();

		const country = this.countries?.find((c) => c.name === record.country);
		this.setCountry(`(${country?.isoCode})`);

		objState = this.state.get();
		const state = objState.localities.states?.find((s) => s.name === record.state);
		this.setState(`(${state?.isoCode})`);

		objState = this.state.get();
		const city = objState.localities.cities?.find((c) => c.name === record.city);
		this.setCity(city?.name as string);

		log.debug({ country, state, city });

		return {
			city: city?.name,
			country: `${country?.name} (${country?.isoCode})`,
			state: `${state?.name} (${state?.isoCode})`
		};
	}

	reset() {
		this.state.set(this.default);
		if (this.search) this.search.resetLocale();
	}

	async setCountry(input: string) {
		log.debug('input', input);
		input = input.split('(')[1].slice(0, -1);
		const state = this.state.get();
		const country = this.countries?.find((c) => c.isoCode === input) as ICountry;

		let states: IState[] = [];
		try {
			states = await (
				await fetch(`${PUBLIC_GEO_API_ENDPOINT}/states?country=${input}`, {
					headers: { authorization: PUBLIC_GEO_API_KEY }
				})
			).json();

			log.debug('states', states);

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
		} catch (err) {
			log.error(err);
		}
	}

	async setState(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const objState = this.state.get();
		const state = objState.localities?.states?.find((s) => s.isoCode === input);

		let cities: ICity[] = [];
		try {
			cities = await (
				await fetch(
					`${PUBLIC_GEO_API_ENDPOINT}/cities?state=${state?.isoCode}&country=${objState.locality.country?.isoCode}`,
					{
						headers: { authorization: PUBLIC_GEO_API_KEY }
					}
				)
			).json();

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
		} catch (err) {
			log.error(err);
		}
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
