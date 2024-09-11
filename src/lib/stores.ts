/* region imports */
import * as persistent from '@nanostores/persistent';

import type { UsersRecord } from '$lib/types';
/* endregion imports */

/* region constants */
const { persistentMap } = persistent;

const encoder = {
	encode: JSON.stringify,
	decode: JSON.parse
};
/* endregion constants */

const user = persistentMap<UsersRecord>('user_', {} as UsersRecord, encoder);

// exports
export { user };
