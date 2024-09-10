/* region imports */
import { dev } from '$app/environment';
import { log } from '$lib/common';
// import { notify } from '$lib/services/notifications';
/* endregion imports */

export async function handleError({ error, event, status, message }) {
	if (status !== 404) {
		// notify({ message, type: 'error' });
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
