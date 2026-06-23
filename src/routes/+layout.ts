/* region imports */
import { browser } from '$app/environment';
import { initState, setState } from '$lib/stores';

/* endregion imports */

let _initialized = false;

export const load = async ({ data }) => {
  if (browser) {
    if (!_initialized) {
      // Full init only on first boot
      initState(data.user?.lang);
      _initialized = true;
    } else if (data.user?.lang) {
      // On subsequent navigations, only sync lang if it changed
      setState({ lang: data.user.lang });
    }
  }

  return data;
};
