/* region imports */
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { UsersResponse } from '$lib/pocketbase.d';
import { posthogInit } from '$lib/posthog';
import { initState } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser && env.PUBLIC_POSTHOG_KEY) {
    // Defer PostHog init to avoid blocking page load with analytics network requests
    setTimeout(() => {
      posthogInit(env.PUBLIC_POSTHOG_KEY, data.user as UsersResponse);
    }, 0);

    initState(data.user?.lang);
  }

  return data;
};
