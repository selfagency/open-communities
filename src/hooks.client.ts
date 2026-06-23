/* region imports */
import posthog from 'posthog-js';
import { dev } from '$app/environment';
import { log } from '$lib/utils';
/* endregion imports */

export const handleError = async ({ error, event, message, status }) => {
  if (status !== 404) {
    if (dev) log.debug('event', event);
    log.error(error);
    // Use posthog-js's native captureException per official PostHog Svelte docs
    posthog.captureException(error);
  }

  return {
    message,
    ...(dev ? { stack: (<Error>error)?.stack } : {}),
    status
  };
};
