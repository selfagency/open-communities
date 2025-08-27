/* region imports */
import { dev } from '$app/environment';
import { log } from '$lib/utils';
/* endregion imports */

export const handleError = ({ error, event, message, status }) => {
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
};
