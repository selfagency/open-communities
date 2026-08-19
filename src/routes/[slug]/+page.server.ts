/* region imports */
import { error } from '@sveltejs/kit';
import { isFunction } from 'radashi';
import type { PagesRecord } from '$lib/pocketbase.d';
import { withRetry } from '$lib/server/api';
import { log } from '$lib/server/logger';
import type { PageServerLoad } from './$types';
/* endregion imports */

export const load: PageServerLoad = async ({ cookies, fetch, locals, params }) => {
  const { api, captureException } = locals;
  const lang = cookies.get('lang') || 'en';

  try {
    const page = await withRetry(() =>
      api.collection('pages').getFirstListItem(api.filter('slug={:slug}', { slug: params.slug }), { fetch })
    );

    // Fetch the matching page variant for the current language
    let variant: Record<string, unknown> | null = null;
    try {
      variant = await withRetry(() =>
        api
          .collection('pageVariants')
          .getFirstListItem(api.filter('page={:pageId} && language={:lang}', { lang, pageId: page.id }), { fetch })
      );
    } catch {
      // No variant for this language — try English fallback
      try {
        variant = await withRetry(() =>
          api
            .collection('pageVariants')
            .getFirstListItem(api.filter('page={:pageId} && language={:lang}', { lang: 'en', pageId: page.id }), {
              fetch
            })
        );
      } catch {
        // No variant at all — render page without localized content
      }
    }

    return {
      page: page as PagesRecord,
      variant: variant as Record<string, unknown> | null
    };
  } catch (err) {
    // Distinguish PB-down from genuine 404 — check BEFORE capturing so expected
    // 404s (non-existent slugs) are not reported as errors.
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

    if (isFunction(captureException)) {
      await captureException(err);
    }

    // PB unreachable after retries — graceful degradation
    log.warn('PocketBase unavailable for slug page', err);
    return { page: undefined, variant: null };
  }
};
