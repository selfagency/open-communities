import type { Properties } from 'posthog-js';
import posthog from 'posthog-js';

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { UsersResponse } from '$lib/pocketbase.d';

function isPostHogConfigured(): boolean {
  return browser && !!env.PUBLIC_POSTHOG_KEY;
}

/**
 * Initialize PostHog analytics. Safe to call multiple times — `posthog.init()`
 * is idempotent. Called once on first boot from `hooks.client.ts` init().
 *
 * Uses the reverse proxy at PUBLIC_POSTHOG_HOST (shomer.opencommunities.info)
 * as api_host, with ui_host pointing to the canonical PostHog UI so toolbar
 * features work correctly.
 */
export function initPosthog(user?: UsersResponse) {
  if (!isPostHogConfigured()) {
    return;
  }

  try {
    posthog.init(env.PUBLIC_POSTHOG_KEY as string, {
      api_host: env.PUBLIC_POSTHOG_HOST,
      capture_exceptions: true,
      capture_pageleave: false,
      capture_pageview: false,
      defaults: '2026-01-30',
      persistence: 'localStorage',
      ui_host: 'https://us.posthog.com'
    });

    if (user) {
      posthog.identify(user.id);
    }
  } catch (e) {
    console.error('[PostHog] init failed (non-blocking):', e);
  }
}

/**
 * Capture a client-side exception via PostHog's native captureException API.
 *
 * No-ops when:
 * - Running outside the browser (SSR)
 * - PostHog is not yet initialised (missing key or init() not yet called)
 *
 * Non-Error values are coerced to Error so PostHog's exception processor can
 * parse the stack, apply grouping rules, and enrich the event automatically.
 *
 * @param error          The thrown value (Error or unknown)
 * @param event          Optional navigation event — pathname forwarded as $exception_url
 * @param additionalProperties  Any extra PostHog properties to attach (e.g. errorId)
 */
export function captureException(
  error: unknown,
  event?: { url?: { pathname?: string } },
  additionalProperties?: Properties
): void {
  // Use key presence as the gate, not _initialized — posthog-js internally queues
  // calls made before init completes, so errors during the init window are not lost.
  // _initialized is only used internally by initPosthog to avoid redundant identify().
  if (!isPostHogConfigured()) {
    return;
  }
  try {
    let message: string;
    if (typeof error === 'string') {
      message = error;
    } else {
      try {
        message = JSON.stringify(error, Object.keys(error as object));
      } catch {
        message = `[${typeof error}]`;
      }
    }
    const err = error instanceof Error ? error : new Error(message);
    const props: Properties = {
      ...(event?.url?.pathname ? { $exception_url: event.url.pathname } : {}),
      ...additionalProperties
    };
    posthog.captureException(err, props);
  } catch (captureError) {
    console.error('[PostHog] captureException failed:', captureError);
  }
}
