import { loadTranslations } from '$lib/i18n';

export const load = async ({ data }) => {
	if (data.i18n) await loadTranslations(data.i18n.locale as string, data.i18n.route);
	return {};
};
