/* region imports */
import type { RequestEvent } from '@sveltejs/kit';

import { shake, uid } from 'radashi';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { logger } from '$lib/utils';
/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({
  name: 'server',
  type: 'pretty'
});
/* endregion variables */

async function logEvent(statusCode: number, event: RequestEvent) {
  const requestLogger = log.getSubLogger({ name: `request_${uid(32)}` });

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
        if (refererHostname === 'localhost' || refererHostname === env.PUBLIC_HOSTNAME) {
          referer = refererUrl.pathname;
        }
      } catch {
        // Invalid referrer URL, keep as is or set to null
        referer = null;
      }
    } else {
      referer = null;
    }

    const logData: object = {
      error: error,
      errorId: errorId,
      errorStackTrace: errorStackTrace,
      headers: dev ? Object.fromEntries(event.request.headers.entries()) : undefined,
      ip: event.request.headers.get('x-forwarded-for') || event.request.headers.get('remote-addr'),
      method: event.request.method,
      pathname: event.url.pathname,
      referer: referer,
      status: statusCode,
      timeInMs: Date.now() - (event?.locals?.startTimer as number),
      url: event.url.toString(),
      userAgent: event.request.headers.get('user-agent')
    };

    requestLogger[error ? 'error' : 'info']('request', shake(logData));
  } catch (err) {
    log.error(err);
  }
}

export { log, logEvent };
