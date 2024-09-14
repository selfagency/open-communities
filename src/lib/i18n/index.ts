/* region imports */
import i18n, { type Config } from 'sveltekit-i18n';

import { log } from '$lib/utils';
/* endregion imports */

const dicts = ['auth', 'common', 'congregation', 'home'];

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(<
	Config<{
		thing: string;
	}>
>{
	initLocale: 'en',
	log: { logger: log },
	loaders: dicts.map((dict) => ({
		locale: 'en',
		key: dict,
		loader: async () => (await import(`./en/${dict}.json`)).default
	}))
});
