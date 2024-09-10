/* region imports */
import { handleError } from '$lib/server/api';
import { api } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { session } = locals;

	try {
		const congregations = await api
			.collection('congregationMeta')
			.getFullList({ fetch, requestKey: `congregationMeta_${session}` });
		return {
			congregations
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
