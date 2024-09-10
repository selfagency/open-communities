import i18n from 'sveltekit-i18n';

const config = {
	loaders: [
		{
			locale: 'en',
			key: 'common',
			loader: async () => (await import('./i18n/en/common.json')).default
		},
		{
			locale: 'es',
			key: 'common',
			loader: async () => (await import('./i18n/es/common.json')).default
		},
		{
			locale: 'fr',
			key: 'common',
			loader: async () => (await import('./i18n/fr/common.json')).default
		},
		{
			locale: 'he',
			key: 'common',
			loader: async () => (await import('./i18n/he/common.json')).default
		},
		{
			locale: 'en',
			key: 'forms',
			loader: async () => (await import('./i18n/en/forms.json')).default
		},
		{
			locale: 'es',
			key: 'forms',
			loader: async () => (await import('./i18n/es/forms.json')).default
		},
		{
			locale: 'fr',
			key: 'forms',
			loader: async () => (await import('./i18n/fr/forms.json')).default
		},
		{
			locale: 'he',
			key: 'forms',
			loader: async () => (await import('./i18n/he/forms.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations } = new i18n(config);
