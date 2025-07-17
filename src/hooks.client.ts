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
	initialScope: {
		user: pick(user.get(), ['id', 'email'] as any)
	},
	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.browserProfilingIntegration(),
		Sentry.feedbackIntegration({
			colorScheme: 'light'
		})
	],
	tracesSampleRate: 0.5
});

export async function customErrorHandler({ error, event, message, status }) {
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
}

export const handleError = Sentry.handleErrorWithSentry(customErrorHandler);
