/* region imports */
import i18n, { type Config } from 'sveltekit-i18n';

import { log } from '$lib/utils';
/* endregion imports */

const dicts = ['auth', 'common', 'congregation'];
const langs = ['en', 'es', 'fr', 'de', 'he', 'nl', 'pt', 'hu', 'ru', 'uk'];
const loaders: any[] = [];

langs.forEach((lang) =>
	dicts.forEach((dict) =>
		loaders.push({
			locale: lang,
			key: dict,
			loader: async () => (await import(`./${lang}/${dict}.json`)).default
		})
	)
);

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(<
	Config<{
		thing: string;
	}>
>{
	initLocale: 'en',
	fallbackLocale: 'en',
	log: { logger: log },
	loaders
});
