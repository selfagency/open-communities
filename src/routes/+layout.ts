import { loadTranslations } from '$lib/i18n';

export const load = async ({ url, data }) => {
	const { pathname } = url;
	await loadTranslations(data.i18n.locale || 'en', pathname);
	return {};
};
