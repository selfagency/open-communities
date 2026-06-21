/* region imports */
import { error } from '@sveltejs/kit';
import { isFunction } from 'radashi';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
/* endregion imports */

export async function load({ fetch, locals, params }) {
  const { api, captureException } = locals;

  try {
    return {
      content: await withRetry(() =>
        api.collection('pages').getFirstListItem(api.filter('slug={:slug}', { slug: params.slug }), { fetch })
      )
    };
  } catch (err) {
    if (isFunction(captureException)) {
      await captureException(err);
    }

    // Distinguish PB-down from genuine 404
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as Record<string, number>).status === 'number' &&
      (err as Record<string, number>).status === 404
    ) {
      // PB responded — slug genuinely not found
      log.warn('Slug not found:', params.slug);
      return error(404, { message: 'Page not found' });
    }

    // PB unreachable after retries — graceful degradation
    log.warn('PocketBase unavailable for slug page', err);
    return { content: undefined };
  }
}
