import { dev } from '$app/environment';
/* region imports */
import { captureException } from '$lib/posthog';
import { log } from '$lib/utils';
/* endregion imports */

export const handleError = async ({ error, event, message, status }) => {
  if (status !== 404) {
    if (dev) log.debug('event', event);
    log.error(error);
    await captureException(error, event, message);
  }

  return {
    message,
    stack: (<Error>error)?.stack,
    status
  };
};
