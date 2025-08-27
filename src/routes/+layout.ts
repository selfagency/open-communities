/* region imports */
import { isEmpty } from 'radashi';

import { browser } from '$app/environment';
import { initState, state } from '$lib/stores';
/* endregion imports */

export const load = async ({ data }) => {
  if (browser) {
    if (isEmpty(state?.get())) {
      initState();
    }
  }

  return data;
};
