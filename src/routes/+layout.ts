import { loadTranslations } from '$lib/i18n';

export const load = async ({ url }) => {
	const { pathname } = url;
	await loadTranslations('en', pathname);
	return {};
};
