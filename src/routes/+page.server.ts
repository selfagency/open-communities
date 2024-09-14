/* region imports */
import { PUBLIC_GEO_API_KEY, PUBLIC_GEO_API_ENDPOINT } from '$env/static/public';
import { handleError } from '$lib/server/api';
import { api, loadUser } from '$lib/server/api';
/* endregion imports */

export async function load({ locals, cookies }) {
	const { session } = locals;
	const client = loadUser(cookies);

	try {
		const page = await api
			.collection('pages')
			.getFirstListItem(`slug="home-${client?.lang || 'en'}"`);

		const congregations = await api.collection('congregationMeta').getFullList({
			fetch,
			requestKey: `congregationMeta_${session}`,
			filter: client?.admin ? '' : 'visible=1'
		});

		const countries = await (
			await fetch(`${PUBLIC_GEO_API_ENDPOINT}/countries`, {
				headers: { authorization: PUBLIC_GEO_API_KEY }
			})
		).json();

		return {
			page,
			countries,
			congregations
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
