import { loadTranslations } from '$lib/translations';

export const load = async ({ url }) => {
	const { pathname } = url;
	const initLocale = 'en';
	await loadTranslations(initLocale, pathname);
	return {};
};
