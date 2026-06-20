/* region imports */
import { PostHog } from 'posthog-node';

import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { log } from '$lib/server/logger';
/* endregion imports */

// Singleton PostHog client — created once, reused across all captures
let _phClient: null | PostHog = null;

function getPhClient(): null | PostHog {
  if (!env.PUBLIC_POSTHOG_KEY) return null;
  if (_phClient) return _phClient;
  _phClient = new PostHog(env.PUBLIC_POSTHOG_KEY, {
    host: env.PUBLIC_POSTHOG_HOST
  });
  return _phClient;
}

// Graceful shutdown on process exit
process.once('beforeExit', () => {
  closePhClient();
});

export async function capture(user: string | undefined, event: string) {
  const phClient = getPhClient();
  if (!phClient) return;

  try {
    phClient.capture({ distinctId: user ?? 'anonymous', event });
    if (dev) {
      await phClient.shutdown();
      _phClient = null;
    } else {
      await phClient.flush();
    }
  } catch (error) {
    log.error('PostHog capture failed:', error);
  }
}

export async function captureException(error: Error, user?: string, other?: Record<string, number | string>) {
  const phClient = getPhClient();
  if (!phClient) return;

  try {
    phClient.captureException(error, user ?? 'anonymous', other);
    if (dev) {
      await phClient.shutdown();
      _phClient = null;
    } else {
      await phClient.flush();
    }
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
