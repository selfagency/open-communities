/* region imports */
import type { ICountry } from 'country-state-city';

import * as persistent from '@nanostores/persistent';
import { assign } from 'radashi';

import type { UsersRecord } from '$lib/types';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
	offsetWidth?: number;
	offsetHeight?: number;
	isMobile?: boolean;
	countries?: ICountry[];
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
/* endregion state */

/* region methods */
export function setState(newState: Partial<State>) {
	state.set(assign(state.get(), newState));
}

export function initState() {
	setState({
		showIntro: true,
		offsetWidth: window.innerWidth,
		offsetHeight: window.innerHeight,
		isMobile: window.innerWidth < 640,
		countries: []
	});
}
/* endregion methods */
