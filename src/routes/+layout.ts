/* region imports */
import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    posthog.init(env.PUBLIC_POSTHOG_KEY as string, {
      api_host: `${window.location.origin}/relay-bVfn`,
      capture_exceptions: true,
      capture_pageleave: false,
      capture_pageview: false
    });

    if (data.user) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        name: data.user.name
      });
    }

    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
