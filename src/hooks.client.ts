/* region imports */
import { dev } from '$app/environment';
import { captureException, initPosthog } from '$lib/posthog';
import { log } from '$lib/utils';
/* endregion imports */

/**
 * SvelteKit client init hook — runs once before the app mounts.
 * Initialises PostHog without a user; identity is set later via
 * initPosthog(user) if a session becomes available.
 */
export function init() {
  initPosthog();
}

export const handleError = ({ error, event, message, status }) => {
  if (status !== 404) {
    const errorId = crypto.randomUUID();
    const err = error as Error;
    const url = event?.url?.pathname ?? 'unknown';

    // Structured label gives immediate triage context in the console:
    // [500] TypeError: Cannot read properties of undefined @ /edit (uuid)
    log.error(`[${status}] ${err?.name ?? 'Error'}: ${err?.message ?? message ?? 'unknown'} @ ${url} (${errorId})`);

    if (dev && err?.stack) {
      log.debug(err.stack);
    }

    captureException(error, event, { errorId });
  }

  return {
    message,
    ...(dev ? { stack: (error as Error)?.stack } : {}),
    status
  };
};
