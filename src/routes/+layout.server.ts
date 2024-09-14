/* region imports */
import { isEmpty } from 'radashi';

import { loadTranslations, translations } from '$lib/i18n';
import { handleError, loadUser } from '$lib/server/api';
/* endregion imports */

export async function load({ locals, url, cookies }) {
	const { session } = locals;
	const { pathname, search } = url;
	const client = loadUser(cookies);
	const locale = !isEmpty(client?.lang) ? client.lang : 'en';
	const auth = cookies.get('auth');

	try {
		const route = `${pathname}${search}`;
		await loadTranslations(locale as string, pathname);

		return {
			i18n: { locale, route },
			translations: translations.get(),
			auth,
			session
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
