/* region imports */
import { isFunction } from 'radashi';

import { cleanResponse, withRetry } from '$lib/server/api';
import { getCachedCountries } from '$lib/server/cache';
import { log } from '$lib/server/logger';

/* endregion imports */

export async function load({ cookies, fetch, locals }) {
  const { api, captureException } = locals;
  const user = api?.authStore?.record;
  const lang = cookies.get('lang') || user?.lang || 'en';

  try {
    const countries = await withRetry(() => getCachedCountries(api, { fetch }));

    return {
      countries: countries.map((c) => cleanResponse(c as unknown as Record<string, unknown>)),
      lang,
      offline: false,
      user
    };
  } catch (err) {
    if (isFunction(captureException)) {
      await captureException(err, user?.id);
    }
    // Graceful degradation: if PB is down after retries, return fallback data
    // so the app shell renders instead of a 500 error page. The offline flag
    // lets the client show a reconnecting banner.
    log.warn('PocketBase unavailable, returning fallback layout data', err);
    return {
      countries: [],
      lang,
      offline: true,
      user: null
    };
  }
}
