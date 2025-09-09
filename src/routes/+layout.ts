/* region imports */
import { isEmpty } from 'radashi';

import type { UsersResponse } from '$lib/pocketbase.d';

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { posthogInit } from '$lib/posthog';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    posthogInit(env.PUBLIC_POSTHOG_KEY as string, data.user as UsersResponse);

    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
