/* region imports */
import { handleError } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { api } = locals;
	const user = api.authStore.record;

	locals.log.info('user', user);

	try {
		return {
			user
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
