import i18n from 'sveltekit-i18n';

const config = {
	loaders: [
		{
			locale: 'en',
			key: 'base',
			loader: async () => (await import('./en/base.json')).default
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
		},
		{
			locale: 'en',
			key: 'forms',
			loader: async () => (await import('./en/forms.json')).default
		},
		{
			locale: 'es',
			key: 'forms',
			loader: async () => (await import('./es/forms.json')).default
		},
		{
			locale: 'fr',
			key: 'forms',
			loader: async () => (await import('./fr/forms.json')).default
		},
		{
			locale: 'he',
			key: 'forms',
			loader: async () => (await import('./he/forms.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(config);
