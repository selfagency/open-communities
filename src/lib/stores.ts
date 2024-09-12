/* region imports */
import * as persistent from '@nanostores/persistent';
import { assign } from 'radashi';

import type { UsersRecord } from '$lib/types';
/* endregion imports */

/* region types  */
type State = {
	showIntro?: boolean;
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
		showIntro: true
	});
}
/* endregion methods */
