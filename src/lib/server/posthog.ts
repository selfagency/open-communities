/* region imports */
import type { RequestEvent } from '@sveltejs/kit';

import { PostHog } from 'posthog-node';

import { env } from '$env/dynamic/public';
/* endregion imports */

export async function capture(user: string, event: string) {
  const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
    host: '/relay-bVfn'
  });
  phClient.capture({ distinctId: user, event });
  await phClient.shutdown();
}

export async function captureException(error: Error, user: string, other: Record<string, number | string>) {
  const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
    host: '/relay-bVfn'
  });
  phClient.captureException(error, user, other);
  await phClient.shutdown();
}

export async function posthogRelay(event: RequestEvent) {
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
  }
}
