/* region imports */
import type { RequestEvent } from '@sveltejs/kit';
import { shake } from 'radashi';
import type { ILogObjMeta } from 'tslog';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { logger } from '$lib/utils';

/* endregion imports */

/* region variables */
// OpenTelemetry log bridge — emits log records via the OTel logger
// configured in src/instrumentation.server.ts, if available.
function otelTransport(logObject: Record<string, unknown> & ILogObjMeta) {
  const otelLogger: undefined | { emit: (record: unknown) => void } = (globalThis as unknown as Record<string, unknown>)
    .__OTEL_LOGGER__ as undefined | { emit: (record: unknown) => void };
  if (!otelLogger) {
    return;
  }

  try {
    const severityMap: Record<string, string> = {
      DEBUG: 'debug',
      ERROR: 'error',
      FATAL: 'fatal',
      INFO: 'info',
      SILLY: 'trace',
      TRACE: 'trace',
      WARN: 'warn'
    };
    const levelName = logObject._meta?.logLevelName as string | undefined;
    otelLogger.emit({
      attributes: {
        'logger.name': logObject._meta?.name?.[0] || 'server',
        'service.name': 'open-communities',
        'service.version': '1.0.0'
      },
      body: typeof logObject === 'object' ? shake(logObject as unknown as Record<string, unknown>) : logObject,
      severityText: (levelName && severityMap[levelName]) || 'info'
    });
  } catch {
    // OTel bridge failure is non-critical; don't let it crash logging
  }
}

// tslog logger with OTel bridge attached
const log = logger.getSubLogger({
  attachedTransports: [otelTransport],
  name: 'server',
  type: 'pretty'
});
/* endregion variables */

function isInternalRequest(pathname: string, host: string): boolean {
  const internalPaths = ['.js', '.css', '.map', '__data.json', 'favicon', '/_app/'];
  return (!dev && host === 'localhost:3000') || internalPaths.some((p) => pathname.includes(p));
}

function resolveReferer(event: RequestEvent): string | null {
  const referer = event.request.headers.get('referer') || event.request.headers.get('referrer');
  if (!referer) {
    return null;
  }
  try {
    const refererUrl = new URL(referer);
    const refererHostname = refererUrl.hostname;
    let appHostname: string | undefined;
    try {
      appHostname = new URL(env.PUBLIC_HOSTNAME ?? '').hostname;
    } catch {
      /* env not set */
    }
    if (refererHostname === 'localhost' || (appHostname && refererHostname === appHostname)) {
      return refererUrl.pathname;
    }
  } catch {
    /* invalid referrer URL */
  }
  return null;
}

function logEvent(statusCode: number, event: RequestEvent) {
  const requestId = crypto.randomUUID();

  try {
    // Skip logging for internal requests
    if (isInternalRequest(event.url.pathname, event.url.host)) {
      return;
    }

    const error = event?.locals?.error;
    const errorId = event?.locals?.errorId;
    const errorStackTrace = event?.locals?.errorStackTrace;
    const referer = resolveReferer(event);

    const sensitiveHeaders = new Set(['auth', 'authorization', 'cookie']);
    const logData: object = {
      error,
      errorId,
      errorStackTrace,
      headers: dev
        ? Object.fromEntries(
            Array.from(event.request.headers.entries()).filter(([k]) => !sensitiveHeaders.has(k.toLowerCase()))
          )
        : undefined,
      ip: event.request.headers.get('x-forwarded-for') || event.request.headers.get('remote-addr'),
      method: event.request.method,
      pathname: event.url.pathname,
      referer,
      status: statusCode,
      timeInMs: Date.now() - (event?.locals?.startTimer as number),
      traceId: event?.locals?.traceId,
      url: event.url.toString(),
      userAgent: event.request.headers.get('user-agent')
    };

    log[error ? 'error' : 'info']('request', shake({ ...logData, requestId }));
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
  }
}

export { log, logEvent };
