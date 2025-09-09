import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import type { UsersResponse } from '$lib/pocketbase.d';

import { env } from '$env/dynamic/public';

export async function captureException(error, event, message) {
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

export async function posthogInit(posthogKey: string, user: UsersResponse) {
  posthog.init(posthogKey, {
    api_host: env.PUBLIC_POSTHOG_HOST,
    capture_exceptions: true,
    capture_pageleave: false,
    capture_pageview: false
  });

  if (user) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name
    });
  }
}
