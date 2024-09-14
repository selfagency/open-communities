import i18n from 'sveltekit-i18n';

import { log } from '$lib/utils';

const dicts = [
	'accommodations',
	'auth',
	'common',
	'congregation',
	'fit',
	'home',
	'location',
	'registration',
	'safety',
	'services'
];

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n({
	initLocale: 'en',
	log: { logger: log },
	loaders: dicts.map((dict) => ({
		locale: 'en',
		key: dict,
		loader: async () => (await import(`./en/${dict}.json`)).default
	}))
});
