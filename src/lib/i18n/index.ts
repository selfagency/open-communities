import i18n, { type Config } from 'sveltekit-i18n';

const config: Config<{
	thing: string;
}> = {
	loaders: [
		{
			locale: 'en',
			key: 'base',
			loader: async () => (await import('./en/base.json')).default
		},
		{
			locale: 'de',
			key: 'base',
			loader: async () => (await import('./de/base.json')).default
		},
		{
			locale: 'es',
			key: 'base',
			loader: async () => (await import('./es/base.json')).default
		},
		{
			locale: 'fr',
			key: 'base',
			loader: async () => (await import('./fr/base.json')).default
		},
		{
			locale: 'he',
			key: 'base',
			loader: async () => (await import('./he/base.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(config);
