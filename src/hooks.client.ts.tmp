/* region imports */
import { pick } from 'radashi';

import { dev } from '$app/environment';
import { user } from '$lib/stores';
import { log } from '$lib/utils';
/* endregion imports */

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

export const handleError = customErrorHandler;
