/* region imports */
import { handleError } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { i18n } = locals;

	try {
		return {
			i18n
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
