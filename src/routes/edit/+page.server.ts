/* region imports */
import { redirect } from '@sveltejs/kit';

import { cleanResponse } from '$lib/api';
import { defaultSchema, deleteSchema, transferSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

export const load = async ({ locals, fetch, cookies, url }) => {
	const { log, api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (client.id) {
			const id = client.admin ? url.searchParams.get('id') : client.congregation;

			const congregation = await api
				.collection('congregationMeta')
				.getFirstListItem(`id="${id}"`, { fetch });
			log.debug(congregation);

			return {
				form: {
					default: await validate(defaultSchema, cleanResponse(congregation)),
					delete: await validate(deleteSchema, { id }),
					transfer: await validate(transferSchema, { id })
				},
				congregation
			};
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
