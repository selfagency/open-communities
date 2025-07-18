/* region imports */
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { loadTranslations } from '$lib/i18n';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
	if (browser) {
		if (isEmpty(state?.get())) {
			initState();
		}
	}

	if (data.user?.lang || data.i18n?.locale) {
		await loadTranslations(data.user?.lang || (data.i18n.locale as string), data.i18n.route);
	}

	return data;
};
