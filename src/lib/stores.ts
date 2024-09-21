/* region imports */
import * as persistent from '@nanostores/persistent';
import { assign } from 'radashi';

import type { CountriesRecord, UsersRecord, UsersLangOptions } from '$lib/types';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	showIntro?: boolean;
	offsetWidth?: number;
	offsetHeight?: number;
	isMobile?: boolean;
	countries?: CountriesRecord[];
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

export const user = persistentMap<UsersRecord & { id: string; email: string }>(
	'user_',
	{} as UsersRecord & { id: string; email: string },
	encoder
);
/* endregion state */

/* region methods */
export function setState(newState: Partial<State>) {
	state.set(assign(state.get(), newState));
}

export function initUser() {
	user.set({
		id: '',
		email: '',
		admin: false,
		congregation: undefined,
		lang: 'en' as UsersLangOptions,
		name: undefined
	});
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
