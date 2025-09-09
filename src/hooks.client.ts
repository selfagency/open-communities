/* region imports */
import posthog from 'posthog-js';

import { dev } from '$app/environment';
import { log } from '$lib/utils';
/* endregion imports */

export const handleError = async ({ error, event, message, status }) => {
  if (status !== 404) {
    if (dev) log.debug('event', event);
    posthog.captureException(error);
    log.error(error);
  }

  return {
    message,
    stack: (<Error>error)?.stack,
    status
  };
};
