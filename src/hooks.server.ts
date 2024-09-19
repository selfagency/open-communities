/* region imports */
import type { CookieSerializeOptions } from 'cookie';

import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { VERCEL_ENV } from '$env/static/private';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { api } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
/* endregion imports */

/* region init */
Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,
	environment: VERCEL_ENV
});
/* endregion init */

/* region variables */
// constants;
const log = logger.getSubLogger({ name: 'hooks' });
/* endregion variables */

/* region methods */
const validate = async (schema: any, request: any = undefined) => {
	return request ? superValidate(request, zod(schema)) : superValidate(zod(schema));
};
/* endregion methods */

async function customHandler({ event, resolve }) {
	const startTimer = Date.now();

	// services
	event.locals.api = api;
	event.locals.log = log;
	event.locals.validate = validate;
	event.locals.cookieOpts = {
		maxAge: 60 * 60 * 24 * 1, // 1 day
		path: '/',
		sameSite: 'strict',
		secure: true
	} as CookieSerializeOptions & { path: string };

	// auth
	event.locals.api.authStore.loadFromCookie(event.cookies.get('auth') ?? '');

	// i18n
	event.locals.i18n = {
		locale: event.locals.api.authStore.model?.lang || 'en',
		route: `${event.url.pathname}${event.url.search}`
	};

	// auth
	try {
		if (event.url.pathname === '/logout') {
			event.cookies.set('auth', '', event.locals.cookieOpts);
			event.cookies.set('session', '', event.locals.cookieOpts);
			event.locals.api.authStore.clear();
		} else {
			if (event.locals.api.authStore.isValid) {
				await event.locals.api.collection('users').authRefresh();
				event.cookies.set(
					'auth',
					event.locals.api.authStore.exportToCookie(),
					event.locals.cookieOpts
				);
			}
		}
	} catch {
		event.locals.api.authStore.clear();
	}

	// response
	const response = await resolve(event);
	event.locals.startTimer = startTimer;
	logEvent(response.status, event);
	return response;
}

export const handle = sequence(
	Sentry.sentryHandle({
		fetchProxyScriptNonce: '%sveltekit.nonce%'
	}),
	customHandler
);

export const handleError = Sentry.handleErrorWithSentry(async ({ status, error, event }) => {
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
});
