/* region imports */
import { cleanResponse, handleError } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { api } = locals;
	const client = api.authStore.record;

	try {
		return {
			congregations: (
				await api.collection('congregationMeta').getFullList({
					fetch,
					filter: client?.admin ? '' : 'visible=1'
				})
			).map((c) => cleanResponse(c)),
			content: await api.collection('pages').getFirstListItem(`slug="home-en"`, { fetch })
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
