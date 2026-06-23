/* region imports */
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { SerializeOptions } from 'cookie';
import { publicIp } from 'public-ip';
import { assign, isEmpty, isFunction } from 'radashi';
import type { SuperValidated } from 'sveltekit-superforms';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { $ZodType, output } from 'zod/v4/core';

import { dev } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createApi } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
import { closeTransporter } from '$lib/server/mail';
import { capture, captureException, closePhClient } from '$lib/server/posthog';
import security from '$lib/server/security';

/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({ name: 'hooks' });
/* endregion variables */

/* Per-session auth-refresh cooldown map.
 * Keyed by the first 32 chars of the auth cookie (stable within a session,
 * non-sensitive prefix) so each user's token is refreshed independently.
 * PocketBase auth tokens are JWT-like with a configurable TTL; refreshing once
 * every 5 minutes per session is plenty without hammering the server.
 * Stale entries are pruned on every request to prevent unbounded growth. */
const authRefreshTimestamps = new Map<string, number>();
const AUTH_REFRESH_COOLDOWN_MS = 300_000; // 5 minutes

function pruneAuthRefreshTimestamps() {
  const cutoff = Date.now() - AUTH_REFRESH_COOLDOWN_MS * 2;
  for (const [key, ts] of authRefreshTimestamps) {
    if (ts < cutoff) authRefreshTimestamps.delete(key);
  }
}

async function customHandler({ event, resolve }: Parameters<Handle>[0]) {
  const startTimer = Date.now();

  let clientIp =
    event.request?.headers?.get('cf-connecting-ip') ?? event.request?.headers?.get('x-forwarded-for') ?? '';
  if (!clientIp) {
    try {
      clientIp = event.getClientAddress();
    } catch {
      // getClientAddress can throw in dev when no proxy headers are set
    }
  }
  // Only attempt public IP resolution in production where the client is not
  // loopback. In dev, 127.0.0.1/::1 is always the result of getClientAddress(),
  // and publicIp() incurs a 500ms timeout penalty on every request.
  const isLoopback = !clientIp || clientIp === '' || clientIp === '::1' || clientIp === '127.0.0.1';
  if (isLoopback && !dev) {
    try {
      clientIp = await Promise.race([
        publicIp(),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('publicIp timed out')), 500))
      ]);
    } catch {
      clientIp = '';
    }
  }

  // Per-request PocketBase instance — avoids race conditions on beforeSend
  // and authStore that would occur with a shared singleton (see P-11).
  const requestApi = createApi();
  requestApi.beforeSend = (url, options) => {
    const ipHeader = clientIp
      ? {
          'X-PocketHost-Client-Ip': clientIp
        }
      : {};
    options.headers = assign({}, { ...options.headers, ...(ipHeader as Record<string, string>) });
    return { options, url };
  };
  event.locals.api = requestApi;
  event.locals.log = log;

  // Create origin-aware PostHog functions
  event.locals.capture = (user: string | undefined, eventName: string) =>
    user ? capture(user, eventName) : Promise.resolve();
  event.locals.captureException = (error: unknown, user?: string, other?: Record<string, number | string>) =>
    captureException(error, user ?? '', other);

  event.locals.validate = (async <S extends $ZodType<Record<string, unknown>>>(
    request: Record<string, unknown> | RequestEvent,
    schema: S
  ): Promise<SuperValidated<output<S>>> => {
    const adapter = zod4(schema);
    if (isEmpty(request)) {
      return (await superValidate(adapter)) as unknown as SuperValidated<output<S>>;
    }
    return (await superValidate(request as unknown as RequestEvent, adapter)) as unknown as SuperValidated<output<S>>;
  }) as App.Locals['validate'];

  event.locals.cookieOpts = {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 1, // 1 day
    path: '/',
    sameSite: 'strict',
    secure: !dev
  } as SerializeOptions & { path: string };

  // auth — load cookie into the per-request instance
  requestApi.authStore.loadFromCookie(event.cookies.get('auth') ?? '');

  // i18n
  const lang = event.cookies.get('lang') || requestApi?.authStore?.record?.lang || 'en';

  event.locals.i18n = {
    locale: lang,
    route: `${event.url.pathname}${event.url.search}`
  };

  // auth
  try {
    if (event.url.pathname === '/logout') {
      event.cookies.set('auth', '', event.locals.cookieOpts);
      event.cookies.set('session', '', event.locals.cookieOpts);
      requestApi.authStore.clear();
    } else if (requestApi?.authStore?.isValid) {
      pruneAuthRefreshTimestamps();
      const now = Date.now();
      // Use the stable session cookie as the cooldown key (not auth cookie, which changes on refresh)
      let sessionKey = event.cookies.get('session');
      if (!sessionKey) {
        sessionKey = crypto.randomUUID();
        event.cookies.set('session', sessionKey, event.locals.cookieOpts);
      }
      const lastRefresh = authRefreshTimestamps.get(sessionKey) ?? 0;
      if (now - lastRefresh > AUTH_REFRESH_COOLDOWN_MS) {
        // Hard timeout on auth refresh to avoid blocking SSR on PB latency
        await Promise.race([
          requestApi.collection('users').authRefresh(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('auth refresh timed out')), 3000))
        ]);
        authRefreshTimestamps.set(sessionKey, now);
      }
      // Re-set the auth cookie on every request to extend its TTL
      event.cookies.set('auth', requestApi.authStore.exportToCookie(), event.locals.cookieOpts);
    }
  } catch (error) {
    // Only clear auth store if refresh actually failed, not for other errors
    log.debug('Auth refresh failed:', error);
    requestApi.authStore.clear();
    // Clear both cookies when auth fails
    event.cookies.set('auth', '', event.locals.cookieOpts);
    event.cookies.set('session', '', event.locals.cookieOpts);
  }

  // Store start timer before resolving the response
  event.locals.startTimer = startTimer;

  // NOTE: Reporting-Endpoints is a response header; it is applied via the
  // Helmet CSP config in security.ts (reportUri / reportTo). Setting it here
  // on event.request has no effect and is removed to avoid confusion.

  // response
  const response = await resolve(event);

  logEvent(response.status, event);
  return response;
}

export const handleError = async ({ error, event, status }) => {
  if (status !== 404) {
    const errorId = crypto.randomUUID();

    event.locals.error = error?.toString() || undefined;
    event.locals.errorStackTrace = (error as Error)?.stack || undefined;
    event.locals.errorId = errorId;
    logEvent(status, event);

    if (isFunction(event.locals.captureException)) {
      await event.locals.captureException(error, event.locals.api?.authStore?.record?.id);
    }

    return {
      errorId,
      message: dev ? (error as Error)?.message || 'An error occurred' : 'An error occurred'
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

/* region graceful shutdown */
// B-6: Clean up resources on process termination
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  closeTransporter();
  closePhClient();
});
/* endregion graceful shutdown */
