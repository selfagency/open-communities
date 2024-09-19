/* region imports */
import * as Sentry from '@sentry/sveltekit';
import { pick } from 'radashi';

import { dev } from '$app/environment';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { user } from '$lib/stores';
import { log } from '$lib/utils';
/* endregion imports */

Sentry.init({
	dsn: PUBLIC_SENTRY_DSN,
	tracesSampleRate: 1.0,
	initialScope: {
		user: pick(user.get(), ['id', 'email'] as any)
	}
});

export async function customErrorHandler({ error, event, status, message }) {
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

export const handleError = Sentry.handleErrorWithSentry(customErrorHandler);
