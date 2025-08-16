/* region imports */
import * as persistent from '@nanostores/persistent';
import { assign } from 'radashi';

import { page } from '$app/state';

// import { log } from '$lib/utils';
/* endregion imports */

/* region types  */
export type SelectOption = { label: string; value: string };

export type State = {
	form?: {
		hasErrors: boolean;
		success: boolean;
	};
	isMobile?: boolean;
	lang?: string;
	loading?: boolean;
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
/* endregion state */

export function initState() {
	setState({
		form: {
			hasErrors: false,
			success: false
		},
		isMobile: window.innerWidth < 640,
		lang: page.data.user?.lang || 'en',
		loading: false,
		offsetHeight: window.innerHeight,
		offsetWidth: window.innerWidth,
		showIntro: true
	});
}

/* region methods */
export function setState(newState: Partial<State>) {
	state.set(assign(state.get(), newState));
}
/* endregion methods */
