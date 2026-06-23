/* region imports */
import { isFunction } from 'radashi';

import { cleanResponse, withRetry } from '$lib/server/api';
import { getCachedCongregations } from '$lib/server/cache';
import { log } from '$lib/server/logger';

/* endregion imports */

export async function load({ fetch, locals }) {
  const { api, captureException } = locals;
  const client = api?.authStore?.record;

  try {
    return {
      congregations: (
        await withRetry(() =>
          getCachedCongregations(api, {
            fetch,
            filter: client?.admin ? '' : 'visible=1'
          })
        )
      ).map((c) => cleanResponse(c as Record<string, unknown>))
    };
  } catch (err) {
    if (isFunction(captureException)) {
      await captureException(err, client?.id);
    }
    // Graceful degradation: if PB is down after retries, show empty map
    log.warn('PocketBase unavailable, returning empty congregation list', err);
    return { congregations: [] };
  }
}
