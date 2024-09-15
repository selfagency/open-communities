/* region imports */
import { handleError } from '$lib/server/api';
/* endregion imports */

export async function load({ locals, fetch }) {
	const { api } = locals;

	try {
		return {
			content: await api.collection('pages').getFirstListItem(`slug="terms"`, { fetch })
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
