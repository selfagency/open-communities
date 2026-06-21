/* region imports */
import { api } from '$lib/api';
import { log } from '$lib/utils';

import type { TypedPocketBase } from './pocketbase.d';
import type { Search } from './search';
import type { City, Country, LocationRecord, LocationState, State } from './types.d';

/* endregion imports */

/**
 * Minimal writable store that satisfies the Svelte store contract.
 * Replaces nanostores `map()` for per-instance Location state.
 */
type StoreReader<T> = { subscribe: (run: (v: T) => void) => () => void };
type LocationStore = StoreReader<LocationState> & {
  get(): LocationState;
  set(v: LocationState): void;
};

function writable<T>(initial: T): {
  subscribe: (run: (v: T) => void) => () => void;
  get: () => T;
  set: (v: T) => void;
} {
  let value = initial;
  const subs = new Set<(v: T) => void>();

  return {
    subscribe(run: (v: T) => void) {
      run(value);
      subs.add(run);
      return () => subs.delete(run);
    },
    get() {
      return value;
    },
    set(v: T) {
      value = v;
      for (const fn of subs) fn(value);
    }
  };
}

export class Location {
  api?: TypedPocketBase;
  countries: Country[];
  default: LocationState;
  search?: Search;
  state: LocationStore;

  constructor({ countries, search }: { countries: Country[]; search?: Search }) {
    if (search) this.search = search;
    this.api = api;

    this.countries = countries as Country[];

    this.default = {
      localities: { countries: this.countries },
      locality: {},
      options: {
        countryOptions: this.countries?.map((c) => ({
          id: c?.id,
          label: c?.name,
          value: `${c?.name} (${c?.code})`
        }))
      },
      record: {}
    } as LocationState;
    this.state = writable<LocationState>(this.default);

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
        await this.setState(record.state, /* preserveCity */ true);

        if (record.city) {
          this.setCity(record.city as string);
        }
      }
    }
  }

  reset() {
    this.state.set(this.default);
    if (this.search) this.search.resetLocation();
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
          city: city as City,
          country: objState.record.country as Country,
          latitude: city?.latitude,
          longitude: city?.longitude,
          state: objState.record.state as State
        }
      });
  }

  async setCountry(input: string) {
    const state = this.state.get();
    const country = this.countries?.find((c) => c?.id === input) as Country;
    const api = this.api as TypedPocketBase;

    let states: State[] = [];
    try {
      states = await api?.collection('states')?.getFullList({
        filter: api?.filter('country={:country}', { country: country?.id })
      });

      if (states)
        this.state.set({
          ...state,
          localities: {
            cities: [],
            countries: state.localities.countries,
            states
          },
          locality: {
            country
          },
          options: {
            cityOptions: [],
            countryOptions: state.options.countryOptions,
            stateOptions: states?.map((s) => ({
              id: s?.id,
              label: s?.name as string,
              value: `${s?.name} (${s.code})`
            }))
          },
          record: {
            city: undefined,
            country,
            latitude: country?.latitude,
            longitude: country?.longitude,
            state: undefined
          }
        });
    } catch (err) {
      log.error(err);
    }
  }

  async setState(input: string, preserveCity?: boolean) {
    const objState = this.state.get();
    const state = objState.localities?.states?.find((s) => s?.id === input) as State;
    const api = this.api as TypedPocketBase;

    let cities: City[] = [];

    try {
      cities = await api?.collection('cities')?.getFullList({
        filter: api?.filter('state={:state}', { state: state?.id })
      });

      if (cities)
        this.state.set({
          ...objState,
          localities: {
            ...objState.localities,
            cities
          },
          locality: {
            country: objState.locality.country,
            state
          },
          options: {
            ...objState.options,
            cityOptions: cities?.map((c) => ({
              id: c?.id,
              label: c?.name as string,
              value: c?.name as string
            }))
          },
          record: {
            city: preserveCity ? objState.record.city : undefined,
            country: objState.record.country as Country,
            latitude: state?.latitude,
            longitude: state?.longitude,
            state: state as State
          }
        });
    } catch (err) {
      log.error(err);
    }
  }
}
