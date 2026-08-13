import type { CitiesRecord, CountriesRecord, StatesRecord } from './pocketbase.d';

export type City = CitiesRecord & { id: string };

export type Country = CountriesRecord & { id: string };

export interface Localities {
  cities?: City[];
  countries: Country[];
  states?: State[];
}
export interface Locality {
  city?: City;
  country?: Country;
  state?: State;
}

export interface LocationMeta {
  city?: City;
  country?: Country;
  latitude?: number;
  longitude?: number;
  state?: State;
}

export interface LocationOptions {
  cityOptions: SelectOption[];
  countryOptions: SelectOption[];
  stateOptions: SelectOption[];
}

export interface LocationRecord {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
}

export interface LocationState {
  localities: Localities;
  locality: Locality;
  options: LocationOptions;
  record: LocationMeta;
}

export interface SearchData {
  accessibility?: Record<string, boolean>;
  denomination?: string;
  flavor?: string;
  health?: { protocol?: string };
  id: string;
  location?: LocationMeta;
  name: string;
  owner?: string;
  registration?: { registrationType?: string };
  security?: Record<string, boolean>;
  services?: Record<string, boolean>;
  visible: boolean;
}

export interface SearchState {
  filters?: {
    [key: string]: {
      [filterKey: string]: boolean;
    };
  };
  searchLocation?: LocationMeta;
  searchTerms?: string;
  showLocation?: boolean;
  [key: string]: unknown;
}

export interface SelectOption {
  id: string;
  label: string;
  value: string;
}

export type State = StatesRecord & { id: string };
