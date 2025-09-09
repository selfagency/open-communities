/* region imports */
import { PostHog } from 'posthog-node';

import { env } from '$env/dynamic/public';
/* endregion imports */

export async function capture(user: string, event: string) {
  try {
    // Validate PostHog key exists
    if (!env.PUBLIC_POSTHOG_KEY) {
      console.warn('PostHog key not configured, skipping capture');
      return;
    }

    const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
      host: env.PUBLIC_POSTHOG_HOST
    });
    phClient.capture({ distinctId: user, event });
    await phClient.shutdown();
  } catch (error) {
    console.error('PostHog capture failed:', error);
  }
}

export async function captureException(error: Error, user: string, other?: Record<string, number | string>) {
  try {
    // Validate PostHog key exists
    if (!env.PUBLIC_POSTHOG_KEY) {
      console.warn('PostHog key not configured, skipping captureException');
      return;
    }

    const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY as string, {
      host: env.PUBLIC_POSTHOG_HOST
    });
    phClient.captureException(error, user, other);
    await phClient.shutdown();
  } catch (phError) {
    console.error('PostHog captureException failed:', phError);
  }
}
