import i18n, { type Config } from 'sveltekit-i18n';

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
	loaders: dicts.map((dict) => ({
		locale: 'en',
		key: dict,
		loader: async () => (await import(`./en/${dict}.json`)).default
	}))
};

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(config);
