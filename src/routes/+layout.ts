/* region imports */
import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    posthog.init(PUBLIC_POSTHOG_KEY, {
      api_host: '/relay-bVfn',
      capture_exceptions: true,
      capture_pageleave: false,
      capture_pageview: false
    });

    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
