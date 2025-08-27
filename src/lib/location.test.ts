import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CitiesResponse, StatesResponse } from './pocketbase.d';

// Why: Mock the PocketBase api and logger so Location methods can be tested deterministically.
vi.mock('$lib/api', () => {
  return {
    api: {
      collection: (name: string) => ({
        getFullList: () => {
          const g = globalThis as unknown as {
            __TEST_CITIES?: unknown[];
            __TEST_STATES?: unknown[];
          };
          if (name === 'states') {
            return Promise.resolve(g.__TEST_STATES || []);
          }
          if (name === 'cities') {
            return Promise.resolve(g.__TEST_CITIES || []);
          }
          return Promise.resolve([]);
        }
      })
    }
  };
});

vi.mock('$lib/utils', () => ({ log: { error: vi.fn() } }));

import { Location } from './location';

const country = { code: 'CO', id: 'c1', latitude: 1, longitude: 2, name: 'CountryOne' };
const _state: Partial<StatesResponse> = {};
_state.id = 's1';
_state.code = 'S1';
_state.name = 'StateOne';
_state.latitude = 3;
_state.longitude = 4;
const state = _state as StatesResponse;

const _city: Partial<CitiesResponse> = {};
_city.id = 'ct1';
_city.latitude = 5;
_city.longitude = 6;
_city.name = 'CityOne';
const city = _city as CitiesResponse;

beforeEach(() => {
  vi.clearAllMocks();
  // test data exposed to mocked api
  const g = globalThis as unknown as {
    __TEST_CITIES?: CitiesResponse[];
    __TEST_STATES?: StatesResponse[];
  };
  g.__TEST_CITIES = [city];
  g.__TEST_STATES = [state];
});

describe('Location', () => {
  it('initializes defaults and countryOptions', () => {
    const loc = new Location({ countries: [country] });
    const s = loc.state.get();
    expect(s.options.countryOptions).toHaveLength(1);
    expect(s.options.countryOptions[0]).toEqual({
      id: country.id,
      label: country.name,
      value: `${country.name} (${country.code})`
    });
  });

  it('setCountry loads states and updates state', async () => {
    const loc = new Location({ countries: [country] });
    await loc.setCountry(country.id);
    const s = loc.state.get();
    expect(s.localities.states).toBeDefined();
    if (s.localities.states) {
      expect(s.localities.states[0].id).toBe(state.id);
    }
    expect(s.options.stateOptions[0]).toHaveProperty('id', state.id);
    expect(s.record.country).toEqual(country);
    expect(s.record.latitude).toBe(country.latitude);
  });

  it('setState loads cities and updates state & options', async () => {
    const loc = new Location({ countries: [country] });
    // pre-populate states so setState can find it
    await loc.setCountry(country.id);
    await loc.setState(state.id);
    const s = loc.state.get();
    expect(s.localities.cities).toBeDefined();
    if (s.localities.cities) {
      expect(s.localities.cities[0].id).toBe(city.id);
    }
    expect(s.options.cityOptions[0]).toHaveProperty('id', city.id);
    expect(s.record.state).toEqual(state);
    expect(s.record.latitude).toBe(state.latitude);
  });

  it('setCity sets locality and record city/coords', async () => {
    const loc = new Location({ countries: [country] });
    await loc.setCountry(country.id);
    await loc.setState(state.id);
    loc.setCity(city.id);
    const s = loc.state.get();
    expect(s.record.city).toEqual(city);
    expect(s.record.latitude).toBe(city.latitude);
    expect(s.locality.city).toBeDefined();
    if (s.locality.city) {
      expect(s.locality.city.id).toBe(city.id);
    }
  });

  it('reset restores default and calls search.resetLocation if present', () => {
    const search = { resetLocation: vi.fn() };
    const loc = new Location({ countries: [country] });
    // attach a minimal search object to avoid Search typing issues
    (loc as unknown as { search?: { resetLocation: () => void } }).search = search;
    loc.setCity('does-not-exist');
    loc.reset();
    const s = loc.state.get();
    expect(s.record).toEqual(loc.default.record);
    expect(search.resetLocation).toHaveBeenCalled();
  });

  it('load applies record country/state/city sequence', async () => {
    const loc = new Location({ countries: [country] });
    await loc.load({ city: city.id, country: country.id, state: state.id });
    const s = loc.state.get();
    expect(s.record.country).toEqual(country);
    expect(s.record.state).toEqual(state);
    expect(s.record.city).toEqual(city);
  });
});
