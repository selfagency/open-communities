import i18n, { type Config } from 'sveltekit-i18n';

import { log } from '$lib/utils';

const dicts = [
	'accommodations',
	'auth',
	'common',
	'congregation',
	'fit',
	'home',
	'locale',
	'registration',
	'safety',
	'services'
];

const config: Config<{
	thing: string;
}> = {
	initLocale: 'en',
	log: { logger: log },
	loaders: await Promise.all(
		dicts.map((dict) => ({
			locale: 'en',
			key: dict,
			loader: async () => (await import(`./en/${dict}.json`)).default
		}))
	)
};

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(config);
