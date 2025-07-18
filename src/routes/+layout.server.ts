/* region imports */
import { handleError, loadUser } from '$lib/server/api';
/* endregion imports */

export async function load({ cookies, locals, url }) {
	const { i18n } = locals;

	try {
		return {
			i18n,
			user: url.pathname.startsWith('/logout') ? undefined : loadUser(cookies)
		};
	} catch (err) {
		return handleError(err as Error);
	}
}
