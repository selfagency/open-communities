/* region imports */
import type { RequestEvent } from '@sveltejs/kit';

import { PostHog } from 'posthog-node';

import { browser } from '$app/environment';
import { page } from '$app/state';
import { env } from '$env/dynamic/public';
/* endregion imports */

export async function capture(user: string, event: string, origin?: string) {
  try {
    // Validate PostHog key exists
    if (!env.PUBLIC_POSTHOG_KEY) {
      console.warn('PostHog key not configured, skipping capture');
      return;
    }

    // Get the origin - use parameter for server-side, page state for client-side
    const hostOrigin = origin || page.url.origin;

    const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
      host: `${hostOrigin}/relay-bVfn`
    });
    phClient.capture({ distinctId: user, event });
    await phClient.shutdown();
  } catch (error) {
    console.error('PostHog capture failed:', error);
  }
}

export async function captureException(
  error: Error,
  user: string,
  origin?: string,
  other?: Record<string, number | string>
) {
  try {
    // Validate PostHog key exists
    if (!env.PUBLIC_POSTHOG_KEY) {
      console.warn('PostHog key not configured, skipping captureException');
      return;
    }

    // Get the origin - use parameter for server-side, page state for client-side
    const hostOrigin = origin || (browser ? page.url.origin : 'http://localhost:5173');

    const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
      host: `${hostOrigin}/relay-bVfn`
    });
    phClient.captureException(error, user, other);
    await phClient.shutdown();
  } catch (phError) {
    console.error('PostHog captureException failed:', phError);
  }
}

export async function posthogRelay({ event, resolve }: { event: RequestEvent; resolve }) {
  const { pathname } = event.url;

  if (pathname.startsWith('/relay-bVfn')) {
    const hostname = pathname.startsWith('/relay-bVfn/static/') ? 'us-assets.i.posthog.com' : 'us.i.posthog.com';

    const url = new URL(event.request.url);
    url.protocol = 'https:';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = pathname.replace('/relay-bVfn/', '');

    const headers = new Headers(event.request.headers);
    headers.set('Accept-Encoding', '');
    headers.set('host', hostname);

    const response = await fetch(url.toString(), {
      body: event.request.body,
      // @ts-expect-error 'duplex' doesn't exist in the type definition
      duplex: 'half',
      headers,
      method: event.request.method
    });

    return response;
  } else {
    return resolve(event);
  }
}
