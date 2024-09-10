/* region imports */
import type { RequestEvent } from '@sveltejs/kit';

import { uid } from 'radashi';

import { PUBLIC_HOSTNAME } from '$env/static/public';
import { logger } from '$lib/common';
/* endregion imports */

/* region variables */
// constants
const log = logger.getSubLogger({
	name: 'server',
	type: process.env.NODE_ENVIRONMENT !== 'production' ? 'pretty' : 'json'
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
			if (refererHostname === 'localhost' || refererHostname === PUBLIC_HOSTNAME) {
				referer = refererUrl.pathname;
			}
		} else {
			referer = null;
		}

		const logData: object = {
			method: event.request.method,
			url: event.url.toString(),
			status: statusCode,
			timeInMs: Date.now() - (event?.locals?.startTimer as number),
			referer: referer,
			error: error,
			errorId: errorId,
			errorStackTrace: errorStackTrace
		};

		requestLogger[error ? 'error' : 'info'](JSON.stringify(logData));
	} catch (err) {
		log.error(err);
	}
}

export { log, logEvent };
