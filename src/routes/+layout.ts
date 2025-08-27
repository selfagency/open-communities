/* region imports */
import posthog from 'posthog-js';
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    if (!isEmpty(posthog)) {
      posthog.init(PUBLIC_POSTHOG_KEY, {
        __add_tracing_headers: ['opencommunities.info'],
        api_host: 'https://us.i.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'always'
      });
    }

    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
