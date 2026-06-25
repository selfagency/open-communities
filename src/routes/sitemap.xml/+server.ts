import { response as sitemapResponse } from 'super-sitemap';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
  const client = locals.api;
  const origin = url.origin;

  // Fetch all visible congregation IDs for the sitemap
  let congregationIds: string[] = [];
  try {
    const congs = await withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=true',
        fields: 'id,updated',
        requestKey: 'sitemap-congs'
      })
    );
    congregationIds = (congs as Array<{ id: string }>).map((c) => c.id);
  } catch {
    // Graceful degradation — sitemap without congregations
  }

  // Fetch all published page slugs
  let pageSlugs: string[] = [];
  try {
    const pages = await withRetry(() =>
      client.collection('pages').getFullList({
        fields: 'slug',
        requestKey: 'sitemap-pages'
      })
    );
    pageSlugs = (pages as Array<{ slug: string }>).map((p) => p.slug);
  } catch {
    // Graceful degradation — sitemap without pages
  }

  return await sitemapResponse({
    origin,

    excludeRoutePatterns: [
      '^/admin.*',
      '^/api.*',
      '^/edit.*',
      '^/add.*',
      '^/contact.*',
      '^/login.*',
      '^/logout.*',
      '^/account.*',
      '^/user.*',
      '^/sitemap.*'
    ],

    paramValues: {
      // CMS pages via [slug] route
      '/[slug]': pageSlugs.map((slug) => [slug])
    },

    additionalPaths: [
      '/',
      // Congregation detail pages — accessed via ?id= query param on home page
      ...congregationIds.map((id) => `/?id=${id}`)
    ],

    defaultChangefreq: 'daily',
    defaultPriority: 0.7,
    sort: 'alpha'
  });
};
