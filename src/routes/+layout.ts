/* region imports */
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { UsersResponse } from '$lib/pocketbase.d';
import { posthogInit } from '$lib/posthog';
import { initState, setState } from '$lib/stores';
/* endregion imports */

let _initialized = false;

export const load = async ({ data }) => {
  if (browser) {
    if (env.PUBLIC_POSTHOG_KEY) {
      setTimeout(() => {
        posthogInit(env.PUBLIC_POSTHOG_KEY, data.user as UsersResponse);
      }, 0);
    }

    if (!_initialized) {
      // Full init only on first boot — sets window dimensions, lang, loading=false
      initState(data.user?.lang);
      _initialized = true;
    } else if (data.user?.lang) {
      // On subsequent navigations, only sync lang if it changed
      setState({ lang: data.user.lang });
    }
  }

  return data;
};
