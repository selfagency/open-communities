/* region imports */
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { loadTranslations } from '$lib/i18n';
import { initState, initUser, state, user } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
	let u;

	if (browser) {
		if (isEmpty(state?.get())) {
			initState();
		}

		u = user?.get();

		if (isEmpty(u)) {
			initUser();
			u = user?.get();
		}
	}

	if (u?.lang || data.i18n?.locale) {
		await loadTranslations(u?.lang || (data.i18n.locale as string), data.i18n.route);
	}

	return {};
};
