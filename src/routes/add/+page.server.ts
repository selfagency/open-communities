/* region imports */
import { redirect } from '@sveltejs/kit';

import type { PagesRecord } from '$lib/types';

import { defaultSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

export const load = async ({ locals, fetch, cookies }) => {
	const { api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (client?.id) {
			const form = await validate(defaultSchema);

			const content = (await api
				.collection('pages')
				.getFirstListItem(`slug="add-${client.lang}"`, { fetch })) as PagesRecord;

			return { form, content };
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
