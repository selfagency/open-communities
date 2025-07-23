/* region imports */
import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

import { dev } from '$app/environment';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { log } from '$lib/utils';
/* endregion imports */

if (!Sentry.isInitialized()) {
	Sentry.init({
		dsn: PUBLIC_SENTRY_DSN,
		tracesSampleRate: 1.0
	});
}

export const handleError = handleErrorWithSentry(({ error, event, message, status }) => {
	if (status !== 404) {
		if (dev) {
			log.debug('event', event);
			log.error(error);
		}
	}

	return {
		message,
		stack: (<Error>error)?.stack,
		status
	};
});
