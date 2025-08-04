/* region imports */
import { cleanResponse, handleError } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { api } = locals;
	const client = api.authStore.record;

	try {
		const [content, congregations] = await Promise.all([
			api.collection('pages').getFirstListItem(`slug="home-en"`, { fetch }),

			api.collection('congregationMeta').getFullList({
				fetch,
				filter: client?.admin ? '' : 'visible=1'
			})
		]);

		return {
			congregations: congregations.map((c) => cleanResponse(c)),
			content
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
