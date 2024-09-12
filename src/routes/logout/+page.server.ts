export const actions = {
	default: async (event) => {
		const { cookies, locals } = event;

		cookies.set('auth', '', locals.cookieOpts);
		cookies.set('session', '', locals.cookieOpts);

		return {};
	}
};
