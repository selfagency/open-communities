/* region imports */
import { handleError } from '$lib/server/api';
import { api, loadUser } from '$lib/server/api';
/* endregion imports */

export async function load({ locals, cookies }) {
	const { session } = locals;
	const client = loadUser(cookies);

	try {
		const congregations = await api.collection('congregationMeta').getFullList({
			fetch,
			requestKey: `congregationMeta_${session}`,
			filter: client.admin ? '' : 'visible=1'
		});
		return {
			congregations
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
