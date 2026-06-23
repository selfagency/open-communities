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
  const otelLogger: undefined | { emit: (record: unknown) => void } = (globalThis as Record<string, unknown>)
    .__OTEL_LOGGER__ as undefined | { emit: (record: unknown) => void };
  if (!otelLogger) return;

  try {
    const severityMap: Record<string, string> = {
      silly: 'trace',
      trace: 'trace',
      debug: 'debug',
      info: 'info',
      warn: 'warn',
      error: 'error',
      fatal: 'fatal'
    };
    otelLogger.emit({
      severityText: severityMap[logObject._meta?.logLevelId as unknown as keyof typeof severityMap] || 'info',
      body: typeof logObject === 'object' ? shake(logObject as Record<string, unknown>) : logObject,
      attributes: {
        'service.name': 'open-communities',
        'service.version': '1.0.0',
        'logger.name': logObject._meta?.name?.[0] || 'server'
      }
    });
  } catch {
    // OTel bridge failure is non-critical; don't let it crash logging
  }
}

// tslog logger with OTel bridge attached
const log = logger.getSubLogger({
  name: 'server',
  type: 'pretty',
  attachedTransports: [otelTransport]
});
/* endregion variables */

async function logEvent(statusCode: number, event: RequestEvent) {
  const requestId = crypto.randomUUID();

  try {
    // Skip logging for internal requests
    const pathname = event.url.pathname;
    if (
      (!dev && event.url.host === 'localhost:3000') ||
      pathname.startsWith('/_app/') ||
      pathname.includes('__data.json') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.map') ||
      pathname.includes('favicon')
    ) {
      return;
    }

    const error = event?.locals?.error;
    const errorId = event?.locals?.errorId;
    const errorStackTrace = event?.locals?.errorStackTrace;

    // Get referrer and handle internal referrers
    let referer = event.request.headers.get('referer') || event.request.headers.get('referrer');
    if (referer) {
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
          referer = refererUrl.pathname;
        }
      } catch {
        // Invalid referrer URL, keep as is or set to null
        referer = null;
      }
    } else {
      referer = null;
    }

    const sensitiveHeaders = new Set(['auth', 'authorization', 'cookie']);
    const logData: object = {
      error: error,
      errorId: errorId,
      errorStackTrace: errorStackTrace,
      headers: dev
        ? Object.fromEntries(
            Array.from(event.request.headers.entries()).filter(([k]) => !sensitiveHeaders.has(k.toLowerCase()))
          )
        : undefined,
      ip: event.request.headers.get('x-forwarded-for') || event.request.headers.get('remote-addr'),
      method: event.request.method,
      pathname: event.url.pathname,
      referer: referer,
      status: statusCode,
      timeInMs: Date.now() - (event?.locals?.startTimer as number),
      url: event.url.toString(),
      userAgent: event.request.headers.get('user-agent')
    };

    log[error ? 'error' : 'info']('request', shake({ ...logData, requestId }));
  } catch (err) {
    log.error(err);
  }
}

export { log, logEvent };
