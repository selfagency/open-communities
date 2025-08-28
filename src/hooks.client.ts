/* region imports */
import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import { dev } from '$app/environment';
import { log } from '$lib/utils';
/* endregion imports */

export const handleError = ({ error, event, message, status }) => {
  if (status !== 404) {
    if (dev) {
      log.debug('event', event);
      log.error(error);
    } else {
      // WebKit-compatible PostHog error capture
      try {
        if (!isEmpty(posthog) && posthog.__loaded) {
          // Convert error to a serializable format for WebKit
          const err = error as Error;
          const errorData = {
            message: err?.message || message || 'Unknown error',
            name: err?.name || 'UnknownError',
            stack: err?.stack || new Error().stack,
            url: event?.url?.pathname || 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          };

          posthog.capture('$exception', {
            $exception_message: errorData.message,
            $exception_stack_trace_raw: errorData.stack,
            $exception_type: errorData.name,
            $exception_url: errorData.url,
            $exception_user_agent: errorData.userAgent
          });
        }
      } catch (captureError) {
        // Fallback if PostHog capture fails
        console.error('Failed to capture exception in PostHog:', captureError);
      }
    }
  }

  return {
    message,
    stack: (<Error>error)?.stack,
    status
  };
};
