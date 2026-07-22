/* region imports */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { SerializeOptions } from 'cookie';
import { publicIpv4 } from 'public-ip';
import { assign, isEmpty, isFunction } from 'radashi';
import type { SuperValidated } from 'sveltekit-superforms';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { $ZodType, output } from 'zod/v4/core';
import { dev } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import type { TypedPocketBase } from '$lib/pocketbase.d';
import { createApi } from '$lib/server/api';
import { logEvent, log as logger } from '$lib/server/logger';
import { closeTransporter } from '$lib/server/mail';
import { capture, captureException, closePhClient } from '$lib/server/posthog';
import security from '$lib/server/security';
import { trace } from '@opentelemetry/api';

/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({ name: 'hooks' });
/* endregion variables */

/* Per-session auth-refresh cooldown map.
 * Keyed by the session cookie (stable UUID set on login, persists across
 * auth refreshes) so each user's token is refreshed independently.
 * PocketBase auth tokens are JWT-like with a configurable TTL; refreshing once
 * every 5 minutes per session is plenty without hammering the server.
 * Stale entries are pruned on every request to prevent unbounded growth. */
const authRefreshTimestamps = new Map<string, number>();
const AUTH_REFRESH_COOLDOWN_MS = 300_000; // 5 minutes

function pruneAuthRefreshTimestamps() {
  const cutoff = Date.now() - AUTH_REFRESH_COOLDOWN_MS * 2;
  for (const [key, ts] of authRefreshTimestamps) {
    if (ts < cutoff) {
      authRefreshTimestamps.delete(key);
    }
  }
}

/**
 * Resolve the client IP for a request.
 * Priority:
 * 1. x-forwarded-for (first entry)
 * 2. x-real-ip
 * 3. public-ip's IPv4 lookup fallback (best-effort)
 */
async function getClientIp(event: RequestEvent): Promise<string | undefined> {
  try {
    const hdr = event.request.headers.get('x-forwarded-for') || event.request.headers.get('x-real-ip');
    if (hdr) {
      // x-forwarded-for may contain a comma-separated list — take the left-most
      return hdr.split(',')[0].trim();
    }

    // Best-effort fallback to the host's public IP (may fail in CI or private networks).
    // Explicitly IPv4-only: publicIp() tries IPv6 first, and this container's egress
    // may have IPv6 available even though the app is only ever addressed over IPv4 —
    // that would silently return an unusable IPv6 address for this purpose.
    // Hard-capped well under the Docker HEALTHCHECK timeout (3s) — this path is hit by
    // the container's own healthcheck request, which has no x-forwarded-for/x-real-ip
    // header. An unbounded/slow lookup here previously hung every request and caused
    // the healthcheck to fail, taking the container out of rotation (503s).
    try {
      const ip = await Promise.race([
        publicIpv4({ timeout: 1000 }),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('publicIpv4 timed out')), 1000))
      ]);
      return ip;
    } catch (err) {
      // Don't escalate — client IP is helpful for logging but not required
      log.debug('getClientIp: public-ip lookup failed', { err });
      return;
    }
  } catch (err) {
    // Defensive: never throw from hook-level helpers
    log.warn('getClientIp: unexpected error while resolving client ip', { err });
    return;
  }
}

function customHandler({ event, resolve }: Parameters<Handle>[0]): Promise<Response> {
  const startTimer = Date.now();

  // Create an OTel span wrapping this request — provides real distributed tracing
  // to PostHog via the OTLP trace exporter configured in instrumentation.server.ts
  const tracer = trace.getTracer('open-communities');

  return tracer.startActiveSpan('request', async (span) => {
    try {
      const traceId = span.spanContext().traceId;
      event.locals.traceId = traceId;

      const result = await handleRequest({ event, resolve, startTimer, traceId });

      span.setAttribute('http.method', event.request.method);
      span.setAttribute('http.url', event.url.toString());
      span.setAttribute('http.status_code', result.status);
      span.setAttribute('http.route', event.url.pathname);
      span.setAttribute('duration_ms', Date.now() - startTimer);
      span.setStatus({ code: result.status >= 500 ? 2 : 0 }); // ERROR or OK

      span.end();
      return result.response;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: 2 }); // ERROR
      span.end();
      throw err;
    }
  });
}

async function handleAuth(event: Parameters<Handle>[0]['event'], requestApi: TypedPocketBase) {
  try {
    if (event.url.pathname === '/logout') {
      event.cookies.set('auth', '', { ...event.locals.cookieOpts, maxAge: 0 });
      event.cookies.set('session', '', { ...event.locals.cookieOpts, maxAge: 0 });
      requestApi.authStore.clear();
    } else if (requestApi?.authStore?.isValid) {
      pruneAuthRefreshTimestamps();
      const now = Date.now();
      let sessionKey = event.cookies.get('session');
      if (!sessionKey) {
        sessionKey = crypto.randomUUID();
        event.cookies.set('session', sessionKey, event.locals.cookieOpts);
      }
      const lastRefresh = authRefreshTimestamps.get(sessionKey) ?? 0;
      if (now - lastRefresh > AUTH_REFRESH_COOLDOWN_MS) {
        await Promise.race([
          requestApi.collection('users').authRefresh(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('auth refresh timed out')), 3000))
        ]);
        authRefreshTimestamps.set(sessionKey, now);
      }
      event.cookies.set('auth', requestApi.authStore.exportToCookie(), event.locals.cookieOpts);
    }
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) {
      log.warn('Auth refresh rejected — clearing auth store', { status });
      requestApi.authStore.clear();
      event.cookies.set('auth', '', event.locals.cookieOpts);
      event.cookies.set('session', '', event.locals.cookieOpts);
    } else {
      log.warn('Auth refresh transient failure — keeping existing token', { error });
    }
  }
}

async function handleRequest({
  event,
  resolve,
  startTimer,
  traceId
}: {
  event: Parameters<Handle>[0]['event'];
  resolve: Parameters<Handle>[0]['resolve'];
  startTimer: number;
  traceId: string;
}): Promise<{ response: Response; status: number }> {
  const clientIp = await getClientIp(event);

  // Per-request PocketBase instance — avoids race conditions on beforeSend
  // and authStore that would occur with a shared singleton (see P-11).
  const requestApi = createApi(traceId);
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

  // Create origin-aware PostHog functions with trace ID propagation
  event.locals.capture = (
    user: string | undefined,
    eventName: string,
    properties?: Record<string, unknown>
  ): Promise<void> => {
    if (user) {
      capture(user, eventName, properties, traceId);
    }
    return Promise.resolve();
  };
  event.locals.captureException = (error: unknown, user?: string, other?: Record<string, number | string>) =>
    captureException(error, user ?? '', other, traceId);

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

  // secure: true only when the browser actually uses HTTPS.
  // x-forwarded-proto covers production behind a TLS-terminating proxy (Cloudflare),
  // event.url.protocol covers direct HTTPS connections.
  // This avoids setting Secure cookies over HTTP, which breaks CI/E2E tests.
  const isSecure = event.request.headers.get('x-forwarded-proto') === 'https' || event.url.protocol === 'https:';
  event.locals.cookieOpts = {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 1, // 1 day
    path: '/',
    sameSite: 'strict',
    secure: isSecure
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
  await handleAuth(event, requestApi);

  // Store start timer before resolving the response
  event.locals.startTimer = startTimer;

  // NOTE: Reporting-Endpoints is a response header; it is applied via the
  // Helmet CSP config in security.ts (reportUri / reportTo). Setting it here
  // on event.request has no effect and is removed to avoid confusion.

  // response
  const response = await resolve(event);

  logEvent(response.status, event);
  return { response, status: response.status };
}

function serializeError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return JSON.stringify({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  if (error == null) {
    return '';
  }
  return JSON.stringify({ message: String(error) });
}

export const handleError = async ({
  error,
  event,
  status
}: {
  error: unknown;
  event: RequestEvent;
  status: number;
}): Promise<{ errorId: string; message: string } | undefined> => {
  if (status !== 404) {
    const errorId = crypto.randomUUID();

    event.locals.error = serializeError(error);
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
