import posthog, { PostHog } from 'posthog-node';

import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from '$env/static/public';

let _client: null | PostHog = null;

export function getPostHogClient() {
  if (!_client) {
    _client = new posthog.PostHog(PUBLIC_POSTHOG_KEY, {
      host: PUBLIC_POSTHOG_HOST
    });
  }
  return _client;
}
