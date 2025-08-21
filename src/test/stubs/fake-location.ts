import { vi } from 'vitest';

import type { LocationMeta, LocationOptions, LocationState } from '$lib/types.d';

export type FakeLocation = ReturnType<typeof createFakeLocation>;

export function createFakeLocation(record: LocationMeta = {}, opts: Partial<LocationOptions> = {}) {
	const options: LocationOptions = {
		cityOptions: opts.cityOptions ?? [],
		countryOptions: opts.countryOptions ?? [],
		stateOptions: opts.stateOptions ?? []
	};

	const state: LocationState = {
		localities: { countries: [] },
		locality: {},
		options,
		record
	} as LocationState;

	const reset = vi.fn();
	const setCity = vi.fn();
	const setCountry = vi.fn();
	const setState = vi.fn();

	return {
		reset,
		setCity,
		setCountry,
		setState,
		state: {
			subscribe: (fn: (v: LocationState) => void) => {
				fn(state);
				return () => {};
			}
		}
	};
}
