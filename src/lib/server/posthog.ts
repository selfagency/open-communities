/* region imports */
import { PostHog } from 'posthog-node';

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

// Graceful shutdown — flush pending events before exit
// beforeExit covers natural exit; SIGTERM/SIGINT covers deployment signals
process.once('beforeExit', closePhClient);
process.once('SIGTERM', closePhClient);
process.once('SIGINT', closePhClient);

export async function capture(user: string | undefined, event: string) {
  const phClient = getPhClient();
  if (!phClient) return;

  try {
    phClient.capture({ distinctId: user ?? 'anonymous', event });
  } catch (error) {
    log.error('PostHog capture failed:', error);
  }
}

export async function captureException(error: unknown, user?: string, other?: Record<string, number | string>) {
  const phClient = getPhClient();
  if (!phClient) return;

  try {
    let fallbackMessage: string;
    try {
      fallbackMessage = typeof error === 'string' ? error : JSON.stringify(error);
    } catch {
      fallbackMessage = String(error);
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
