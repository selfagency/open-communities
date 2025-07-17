/* region imports */
import * as persistent from '@nanostores/persistent';
import { assign } from 'radashi';

import type { CountriesRecord, UsersLangOptions, UsersRecord } from '$lib/types';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	countries?: CountriesRecord[];
	isMobile?: boolean;
	offsetHeight?: number;
	offsetWidth?: number;
	showIntro?: boolean;
};
/* endregion types */

/* region variables */
// constants
const { persistentMap } = persistent;

const encoder = {
	decode: JSON.parse,
	encode: JSON.stringify
};
/* endregion variables */

/* region state */
export const state = persistentMap<State>('state_', {} as State, encoder);

export const user = persistentMap<UsersRecord & { email: string; id: string; }>(
	'user_',
	{} as UsersRecord & { email: string; id: string; },
	encoder
);
/* endregion state */

export function initState() {
	setState({
		countries: [],
		isMobile: window.innerWidth < 640,
		offsetHeight: window.innerHeight,
		offsetWidth: window.innerWidth,
		showIntro: true
	});
}

export function initUser() {
	user.set({
		admin: false,
		congregation: undefined,
		email: '',
		id: '',
		lang: 'en' as UsersLangOptions,
		name: undefined
	});
}

/* region methods */
export function setState(newState: Partial<State>) {
	state.set(assign(state.get(), newState));
}
/* endregion methods */
