/* region imports */
import { handleErrorWithSentry } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

import { dev } from '$app/environment';
import { log } from '$lib/utils';
/* endregion imports */

if (!Sentry.isInitialized()) {
	Sentry.init({
		dsn: 'https://304d7d493ffd890f8928c8fa11a5007e@o247950.ingest.us.sentry.io/4507958645948416',
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
