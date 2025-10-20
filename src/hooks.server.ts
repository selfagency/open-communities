/* region imports */
import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';

import { sequence } from '@sveltejs/kit/hooks';
import { internalIpV4 } from 'internal-ip';
import { assign, isEmpty, isFunction, uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

// import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { api } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
import { capture, captureException } from '$lib/server/posthog';
import security from '$lib/server/security';
/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({ name: 'hooks' });
/* endregion variables */

async function customHandler({ event, resolve }) {
  const startTimer = Date.now();

  let clientIp =
    event.request?.headers?.get('cf-connecting-ip') ??
    event.request?.headers?.get('x-forwarded-for') ??
    event.getClientAddress();
  if (clientIp === '::1' || clientIp === '127.0.0.1') {
    clientIp = await internalIpV4();
  }

  // services
  event.locals.api = api;
  event.locals.api.beforeSend = function (url, options) {
    options.headers = assign(
      {},
      {
        ...options.headers,
        'X-PocketHost-Client-Ip': clientIp || ''
      }
    );
    return { options, url };
  };
  event.locals.log = log;

  // Create origin-aware PostHog functions
  event.locals.capture = (user: string, eventName: string) => capture(user, eventName);
  event.locals.captureException = (error: Error, user: string, other?: Record<string, number | string>) =>
    captureException(error, user, other);

  event.locals.validate = async (request: RequestEvent, schema) => {
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
  const lang = event.cookies.get('lang') || event.locals.api?.authStore?.record?.lang || 'en';

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
      if (event.locals.api?.authStore?.isValid) {
        await event.locals.api.collection('users').authRefresh();
        event.cookies.set('auth', event.locals.api?.authStore?.exportToCookie(), event.locals.cookieOpts);
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

  // Store start timer before resolving the response
  event.locals.startTimer = startTimer;

  event.request.headers.set(
    'Reporting-Endpoints',
    `posthog="${env.PUBLIC_POSTHOG_HOST}/report/?token=${env.PUBLIC_POSTHOG_TOKEN}"`
  );

  // response
  const response = await resolve(event);

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

    if (isFunction(event.locals.captureException)) {
      await event.locals.captureException(error, event.locals.api?.authStore?.record?.id);
    }

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

export const handle = sequence(security, customHandler, handleParaglide);
