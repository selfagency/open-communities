import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { UsersResponse } from '$lib/pocketbase.d';

/**
 * Initialize PostHog analytics. Safe to call multiple times — `posthog.init()`
 * is idempotent. Call once on first boot from the root layout load function.
 *
 * Uses the reverse proxy at PUBLIC_POSTHOG_HOST (shomer.opencommunities.info)
 * as api_host, with ui_host pointing to the same instance so toolbar features
 * work correctly.
 */
export function initPosthog(user?: UsersResponse) {
  if (!browser || !env.PUBLIC_POSTHOG_KEY) return;

  try {
    posthog.init(env.PUBLIC_POSTHOG_KEY, {
      api_host: env.PUBLIC_POSTHOG_HOST,
      ui_host: 'https://us.posthog.com',
      defaults: '2026-01-30',
      capture_exceptions: true,
      capture_pageleave: false,
      capture_pageview: false,
      autocapture: false,
      persistence: 'localStorage'
    });

    if (user) {
      posthog.identify(user.id);
    }
  } catch (e) {
    console.error('[PostHog] Init failed (non-blocking):', e);
  }
}

export async function captureException(
  error: unknown,
  event?: { url?: { pathname?: string } },
  message?: string
): Promise<void> {
  try {
    if (!isEmpty(posthog) && posthog.__loaded) {
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
    console.error('[PostHog] captureException failed:', captureError);
  }
}
