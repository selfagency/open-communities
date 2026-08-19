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
      ).map((c) => cleanResponse(c as unknown as Record<string, unknown>))
    };
  } catch (err) {
    // Transient rate-limit / connection errors are handled gracefully below
    // (empty list) — don't report them as PostHog errors. Only capture genuine
    // unexpected failures.
    const status =
      err && typeof err === 'object' && 'status' in err ? (err as Record<string, number>).status : undefined;
    const isTransient =
      status === 429 || status === 502 || status === 503 || status === 504 || status === 520 || status === 524;

    if (!isTransient && isFunction(captureException)) {
      await captureException(err, client?.id);
    }
    // Graceful degradation: if PB is down after retries, show empty map
    log.warn('PocketBase unavailable, returning empty congregation list', err);
    return { congregations: [] };
  }
}
