import type {
	CitiesRecord,
	CountriesRecord,
	StatesRecord,
} from "./pocketbase.d";

export type City = CitiesRecord & { id: string };

export type Country = CountriesRecord & { id: string };

export type Localities = {
	cities?: City[];
	countries: Country[];
	states?: State[];
};
export type Locality = {
	city?: City;
	country?: Country;
	state?: State;
};

export type LocationMeta = {
	city?: City;
	country?: Country;
	latitude?: number;
	longitude?: number;
	state?: State;
};

export type LocationOptions = {
	cityOptions: SelectOption[];
	countryOptions: SelectOption[];
	stateOptions: SelectOption[];
};

export type LocationRecord = {
	city?: string;
	country?: string;
	latitude?: number;
	longitude?: number;
	state?: string;
};

export type LocationState = {
	localities: Localities;
	locality: Locality;
	options: LocationOptions;
	record: LocationMeta;
};

export type SearchData = {
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
};

export type SearchState = {
	filters?: {
		[key: string]: {
			[key: string]: boolean;
		};
	};
	searchLocation?: LocationMeta;
	searchTerms?: string;
	showLocation?: boolean;
};

export type SelectOption = { id: string; label: string; value: string };

export type State = StatesRecord & { id: string };
