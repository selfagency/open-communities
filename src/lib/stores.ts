/* region imports */
import type { MapStore } from 'nanostores';

import * as persistent from '@nanostores/persistent';
import { Country, State, City, type ICity, type IState, type ICountry } from 'country-state-city';
import { map } from 'nanostores';
import { assign } from 'radashi';

import type { UsersRecord, LocalesRecord } from '$lib/types';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
	searchTerms?: string;
	searchLocale?: LocalesRecord;
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

export class Locale {
	state: MapStore<LocaleState>;

	constructor() {
		this.state = map<LocaleState>();
		this.setCountry = this.setCountry.bind(this);
		this.setState = this.setState.bind(this);
		this.setCity = this.setCity.bind(this);

		const countries = Country.getAllCountries();

		this.state.set({
			localities: { countries },
			options: {
				countryOptions: countries.map((c) => ({
					label: c.name,
					value: `${c.name} (${c.isoCode})`
				}))
			}
		} as LocaleState);
	}

	setCountry(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const state = this.state.get();
		const country = state.localities.countries.find((c) => c.isoCode === input) as ICountry;
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
			}
		});
	}

	setState(input: string) {
		input = input.split('(')[1].slice(0, -1);
		const objState = this.state.get();
		const cities = City.getCitiesOfState(objState.locality.country?.isoCode as string, input);

		this.state.set({
			...objState,
			locality: {
				...objState.locality,
				state: objState.localities.states?.find((s) => s.isoCode === input)
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
		showIntro: true,
		searchTerms: '',
		filters: {}
	});
}
/* endregion methods */
