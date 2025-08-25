import type { Handle } from '@sveltejs/kit';
/* region imports */
import type { SerializeOptions } from 'cookie';

import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { isEmpty, uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { dev } from '$app/environment';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { api } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';

/* endregion imports */
/* region init */
if (!Sentry.isInitialized()) {
	Sentry.init({ dsn: PUBLIC_SENTRY_DSN, tracesSampleRate: 1.0 });
}
/* endregion init */

/* region variables */
// constants;
const log = logger.getSubLogger({ name: 'hooks' });

/* endregion variables */
async function customHandler({ event, resolve }) {
	const startTimer = Date.now();

	// services
	event.locals.api = api;
	event.locals.log = log;

	event.locals.validate = async (schema, request) => {
		return !isEmpty(request) ? superValidate(request, zod4(schema)) : superValidate(zod4(schema));
	};

	event.locals.cookieOpts = {
		httpOnly: false,
		maxAge: 60 * 60 * 24 * 1, // 1 day
		path: '/',
		sameSite: 'lax',
		secure: !dev
	} as SerializeOptions & { path: string };

	// auth
	event.locals.api.authStore.loadFromCookie(event.cookies.get('auth') ?? '');

	// i18n
	const lang = event.cookies.get('lang') || event.locals.api.authStore.model?.lang || 'en';

	event.locals.i18n = {
		locale: lang,
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

export const handleError = handleErrorWithSentry(async ({ error, event, status }) => {
	if (status !== 404) {
		const errorId = uid(32);

		event.locals.error = error?.toString() || undefined;
		event.locals.errorStackTrace = (error as Error)?.stack || undefined;
		event.locals.errorId = errorId;
		logEvent(status, event);

		return {
			errorId,
			message: (error as Error)?.message || 'An error occurred'
		};
	}
});

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale, request }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', locale === 'he' ? 'rtl' : 'ltr')
		});
	});

export const handle = sequence(sentryHandle(), handleParaglide, customHandler);
