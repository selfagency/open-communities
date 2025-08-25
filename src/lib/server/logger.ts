/* region imports */
import type { RequestEvent } from '@sveltejs/kit';

import { shake, uid } from 'radashi';

// import { dev } from '$app/environment';
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
		const error = event?.locals?.error;
		const errorId = event?.locals?.errorId;
		const errorStackTrace = event?.locals?.errorStackTrace;

		let referer = event.request.headers.get('referer');
		if (referer) {
			const refererUrl = new URL(referer);
			const refererHostname = refererUrl.hostname;
			if (refererHostname === 'localhost' || refererHostname === env.PUBLIC_HOSTNAME) {
				referer = refererUrl.pathname;
			}
		} else {
			referer = null;
		}

		const logData: object = {
			error: error,
			errorId: errorId,
			errorStackTrace: errorStackTrace,
			method: event.request.method,
			referer: referer,
			status: statusCode,
			timeInMs: Date.now() - (event?.locals?.startTimer as number),
			url: event.url.toString()
		};

		requestLogger[error ? 'error' : 'info']('request', shake(logData));
	} catch (err) {
		log.error(err);
	}
}

export { log, logEvent };
