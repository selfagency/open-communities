/* region imports */
import type { Handle } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';

import { sequence } from '@sveltejs/kit/hooks';
import { PostHog } from 'posthog-node';
import { isEmpty, uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
// import { dev } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { api } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({ name: 'hooks' });

/* endregion variables */
async function customHandler({ event, resolve }) {
  const startTimer = Date.now();

  // services
  event.locals.api = api;
  event.locals.log = log;
  event.locals.captureException = async (error, user, other) => {
    const phClient = new PostHog(PUBLIC_POSTHOG_KEY, {
      host: 'https://us.i.posthog.com'
    });
    phClient.captureException(error, user, other);
    await phClient.shutdown();
  };

  event.locals.validate = async (request, schema) => {
    return !isEmpty(request) ? superValidate(request, zod4(schema)) : superValidate(zod4(schema));
  };

  event.locals.cookieOpts = {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 1, // 1 day
    path: '/',
    sameSite: 'lax'
    // secure: !dev
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
        event.cookies.set('auth', event.locals.api.authStore.exportToCookie(), event.locals.cookieOpts);
        // Maintain session cookie if auth refresh succeeds
        if (!event.cookies.get('session')) {
          event.cookies.set('session', uid(32), event.locals.cookieOpts);
        }
      }
    }
  } catch (error) {
    // Only clear auth store if refresh actually failed, not for other errors
    log.debug('Auth refresh failed:', error);
    event.locals.api.authStore.clear();
    // Clear both cookies when auth fails
    event.cookies.set('auth', '', event.locals.cookieOpts);
    event.cookies.set('session', '', event.locals.cookieOpts);
  }

  // response
  const response = await resolve(event);

  event.locals.startTimer = startTimer;
  logEvent(response.status, event);
  return response;
}

export const handleError = async ({ error, event, status }) => {
  if (status !== 404) {
    const errorId = uid(32);

    event.locals.error = error?.toString() || undefined;
    event.locals.errorStackTrace = (error as Error)?.stack || undefined;
    event.locals.errorId = errorId;
    logEvent(status, event);

    await event.locals.captureException(error, event.locals.api.authStore.record?.id);

    return {
      errorId,
      message: (error as Error)?.message || 'An error occurred'
    };
  }
};

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ locale, request }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace('%paraglide.lang%', locale).replace('%paraglide.dir%', locale === 'he' ? 'rtl' : 'ltr')
    });
  });

export const handle = sequence(handleParaglide, customHandler);
