// import posthog from 'posthog-js';
/* region imports */
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    // posthog.init('phc_qzaqrjtbSUFKRMDZb8TXQosR3MInxaJwJS3yTrZbVfn', {
    //   __add_tracing_headers: ['opencommunities.info'],
    //   api_host: 'https://us.i.posthog.com',
    //   defaults: '2025-05-24',
    //   person_profiles: 'always'
    // });

    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
