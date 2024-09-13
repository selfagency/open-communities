/* region imports */
import type { MapStore } from 'nanostores';

import { Country, State, City, type ICity, type IState, type ICountry } from 'country-state-city';
import { map } from 'nanostores';

import type { LocalesRecord } from './types';

import { Search } from './search';

// import { log } from '$lib/utils';
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
		this.state.set(this.default);
		if (this.search) this.search.resetLocale();
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
