import { loadTranslations } from '$lib/i18n';

export const load = async ({ url }) => {
	const { pathname } = url;
	const initLocale = 'en';
	await loadTranslations(initLocale, pathname);
	return {};
};
