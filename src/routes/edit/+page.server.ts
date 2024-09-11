/* region imports */
import type { CongregationsRecord } from '$lib/types';

import { defaultSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

export const load = async ({ locals, fetch, cookies }) => {
	const form = await locals.validate(defaultSchema);

	const client = loadUser(cookies);
	let congregation: CongregationsRecord;
	try {
		congregation = await locals.api
			.collection('congregationMeta')
			.getFirstListItem(`id="${client.congregation}"`, {
				fetch
			});
	} catch (error) {
		return handleError(error);
	}

	return { form, congregation };
};
