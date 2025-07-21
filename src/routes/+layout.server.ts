/* region imports */
import { handleError } from '$lib/server/api';
// import { log } from '$lib/server/logger';
/* endregion imports */

export async function load({ cookies, locals }) {
	const { api } = locals;
	const user = api.authStore.record;
	const lang = cookies.get('lang') || user?.lang || 'en';

	try {
		return {
			lang,
			user
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
