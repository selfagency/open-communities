/* region imports */
import { redirect } from '@sveltejs/kit';

import { defaultSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

export const load = async ({ locals, fetch, cookies }) => {
	const client = loadUser(cookies);

	try {
		if (client.id) {
			const congregation = await locals.api
				.collection('congregationMeta')
				.getFirstListItem(`id="${client.congregation}"`, {
					fetch
				});
			const form = await locals.validate(congregation, defaultSchema);
			return { form, congregation };
		} else {
			throw new Error('403');
		}
	} catch (error) {
		if ((error as Error).message === '403') {
			redirect(302, '/login');
		} else {
			return handleError(error);
		}
	}
};
