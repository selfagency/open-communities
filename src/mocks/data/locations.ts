export interface CityFixture {
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  state: string;
  updated: string;
}

export interface CountryFixture {
  code: string;
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  name: string;
  updated: string;
}

export interface StateFixture {
  code: string;
  collectionId: string;
  collectionName: string;
  country: string;
  created: string;
  id: string;
  name: string;
  updated: string;
}

export const countries: CountryFixture[] = [
  {
    code: 'US',
    collectionId: 'pbc_countries',
    collectionName: 'countries',
    created: '2025-01-01T00:00:00Z',
    id: 'country_us',
    name: 'United States',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'CA',
    collectionId: 'pbc_countries',
    collectionName: 'countries',
    created: '2025-01-01T00:00:00Z',
    id: 'country_ca',
    name: 'Canada',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'IL',
    collectionId: 'pbc_countries',
    collectionName: 'countries',
    created: '2025-01-01T00:00:00Z',
    id: 'country_il',
    name: 'Israel',
    updated: '2025-01-01T00:00:00Z'
  }
];

export const states: StateFixture[] = [
  {
    code: 'NY',
    collectionId: 'pbc_states',
    collectionName: 'states',
    country: 'country_us',
    created: '2025-01-01T00:00:00Z',
    id: 'state_ny',
    name: 'New York',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'CA',
    collectionId: 'pbc_states',
    collectionName: 'states',
    country: 'country_us',
    created: '2025-01-01T00:00:00Z',
    id: 'state_ca',
    name: 'California',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'ON',
    collectionId: 'pbc_states',
    collectionName: 'states',
    country: 'country_ca',
    created: '2025-01-01T00:00:00Z',
    id: 'state_on',
    name: 'Ontario',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'QC',
    collectionId: 'pbc_states',
    collectionName: 'states',
    country: 'country_ca',
    created: '2025-01-01T00:00:00Z',
    id: 'state_qc',
    name: 'Quebec',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    code: 'TA',
    collectionId: 'pbc_states',
    collectionName: 'states',
    country: 'country_il',
    created: '2025-01-01T00:00:00Z',
    id: 'state_ta',
    name: 'Tel Aviv',
    updated: '2025-01-01T00:00:00Z'
  }
];

export const allCities: CityFixture[] = [
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_nyc',
    latitude: 40.7128,
    longitude: -74.006,
    name: 'New York City',
    state: 'state_ny',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_albany',
    latitude: 42.6526,
    longitude: -73.7562,
    name: 'Albany',
    state: 'state_ny',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_sf',
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco',
    state: 'state_ca',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_la',
    latitude: 34.0522,
    longitude: -118.2437,
    name: 'Los Angeles',
    state: 'state_ca',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    name: 'Toronto',
    state: 'state_on',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_montreal',
    latitude: 45.5017,
    longitude: -73.5673,
    name: 'Montreal',
    state: 'state_qc',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_telaviv',
    latitude: 32.0853,
    longitude: 34.7818,
    name: 'Tel Aviv',
    state: 'state_ta',
    updated: '2025-01-01T00:00:00Z'
  },
  {
    collectionId: 'pbc_cities',
    collectionName: 'cities',
    created: '2025-01-01T00:00:00Z',
    id: 'city_jaffa',
    latitude: 32.0504,
    longitude: 34.7523,
    name: 'Jaffa',
    state: 'state_ta',
    updated: '2025-01-01T00:00:00Z'
  }
];

export function findCitiesByState(stateId: string): CityFixture[] {
  return allCities.filter((c) => c.state === stateId);
}

export function findStatesByCountry(countryId: string): StateFixture[] {
  return states.filter((s) => s.country === countryId);
}
