/* region imports */
import { handleError } from '$lib/server/api';
import { cleanResponse } from '$lib/server/api';
/* endregion imports */

export async function load({ locals }) {
	const { api } = locals;
	const client = api.authStore.record;
	const locale = client?.lang || 'en';

	try {
		const [content, congregations, countries] = await Promise.all([
			api.collection('pages').getFirstListItem(`slug="home-${locale}"`, { fetch }),

			api.collection('congregationMeta').getFullList({
				fetch,
				filter: client?.admin ? '' : 'visible=1'
			}),

			api.collection('countries').getFullList({
				fetch
			})
		]);

		// log.info('homepage data', { congregations, content, countries });

		return {
			congregations: congregations.map((c) => cleanResponse(c)),
			content,
			countries: countries.map((c) => cleanResponse(c))
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
