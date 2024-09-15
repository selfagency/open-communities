/* region imports */
import * as Sentry from '@sentry/sveltekit';

import { dev } from '$app/environment';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { log } from '$lib/utils';
/* endregion imports */

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,
	integrations: [Sentry.replayIntegration()],
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0
});

async function errorHandler({ error, event, status, message }) {
	if (status !== 404) {
		if (dev) {
			log.debug('event', event);
			log.error(error);
		}
	}

	return {
		message,
		status,
		stack: (<Error>error)?.stack
	};
}

export const handleError = Sentry.handleErrorWithSentry(errorHandler);
