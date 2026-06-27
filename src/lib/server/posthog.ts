/* region imports */
import { PostHog } from 'posthog-node';

import { env } from '$env/dynamic/public';
import { log } from '$lib/server/logger';

/* endregion imports */

// Singleton PostHog client — created once, reused across all captures
let _phClient: null | PostHog = null;

function getPhClient(): null | PostHog {
  if (!env.PUBLIC_POSTHOG_KEY) {
    return null;
  }
  if (_phClient) {
    return _phClient;
  }
  _phClient = new PostHog(env.PUBLIC_POSTHOG_KEY, {
    host: env.PUBLIC_POSTHOG_HOST
  });
  return _phClient;
}

// Graceful shutdown — flush pending events before exit
// beforeExit covers natural exit; SIGTERM/SIGINT covers deployment signals
process.once('beforeExit', closePhClient);
process.once('SIGTERM', closePhClient);
process.once('SIGINT', closePhClient);

export function capture(user: string | undefined, event: string, properties?: Record<string, unknown>) {
  const phClient = getPhClient();
  if (!phClient) {
    return;
  }

  try {
    phClient.capture({
      distinctId: user ?? 'anonymous',
      event,
      properties: {
        env: process.env.NODE_ENV ?? 'production',
        ...properties
      }
    });
  } catch (error) {
    log.error('PostHog capture failed:', error);
  }
}

// biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
export async function captureException(error: unknown, user?: string, other?: Record<string, number | string>) {
  const phClient = getPhClient();
  if (!phClient) {
    return;
  }

  try {
    let fallbackMessage: string;
    if (typeof error === 'string') {
      fallbackMessage = error;
    } else if (error instanceof Error) {
      fallbackMessage = error.message;
    } else {
      try {
        fallbackMessage = JSON.stringify(error, Object.keys(error as object));
      } catch {
        fallbackMessage = `[${typeof error}] ${Object.prototype.toString.call(error)}`;
      }
    }
    const errMsg = error instanceof Error ? error : new Error(fallbackMessage);
    phClient.captureException(errMsg, user ?? 'anonymous', other);
  } catch (phError) {
    log.error('PostHog captureException failed:', phError);
  }
}

export function closePhClient() {
  if (_phClient) {
    _phClient.shutdown();
    _phClient = null;
  }
}
