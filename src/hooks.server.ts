/* region imports */
import type { CookieSerializeOptions } from 'cookie';

import { uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { joi } from 'sveltekit-superforms/adapters';

import { api } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
/* endregion imports */

/* region variables */
// constants;
const log = logger.getSubLogger({ name: 'hooks' });
/* endregion variables */

/* region methods */
const validate = async (schema: any, request: any = undefined) => {
	return request ? superValidate(request, joi(schema)) : superValidate(joi(schema));
};
/* endregion methods */

export async function handle({ event, resolve }) {
	const startTimer = Date.now();
	event.locals.startTimer = startTimer;
	event.locals.cookieOpts = {
		maxAge: 60 * 60 * 24 * 1, // 1 day
		path: '/',
		sameSite: 'strict',
		secure: true
	} as CookieSerializeOptions & { path: string };
	event.locals.api = api;
	event.locals.api.authStore.loadFromCookie(event.cookies.get('auth') ?? '');

	try {
		if (event.url.pathname === '/logout') {
			event.cookies.set('auth', '', event.locals.cookieOpts);
			event.cookies.set('session', '', event.locals.cookieOpts);
			event.locals.api.authStore.clear();
		} else {
			if (event.locals.api.authStore.isValid) {
				await event.locals.api.collection('users').authRefresh();
			}
		}
	} catch {
		event.locals.api.authStore.clear();
	}

	event.cookies.set('auth', event.locals.api.authStore.exportToCookie(), event.locals.cookieOpts);
	event.locals.log = log;
	event.locals.validate = validate;

	const response = await resolve(event);
	logEvent(response.status, event);
	return response;
}

export const handleError = async ({ status, error, event }) => {
	if (status !== 404) {
		const errorId = uid(32);

		event.locals.error = error?.toString() || undefined;
		event.locals.errorStackTrace = (error as Error)?.stack || undefined;
		event.locals.errorId = errorId;

		logEvent(status, event);

		return {
			message: (error as Error)?.message || 'An error occurred',
			errorId
		};
	}
};
