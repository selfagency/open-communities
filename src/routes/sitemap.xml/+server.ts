import { response } from 'super-sitemap/sveltekit';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

const EXCLUDE_ROUTES = [
  /^\/admin/,
  /^\/api/,
  /^\/edit/,
  /^\/add/,
  /^\/contact/,
  /^\/login/,
  /^\/logout/,
  /^\/account/,
  /^\/user/,
  /^\/sitemap/
];
const SLUG_ROUTE_PATTERN = /^\/\[slug\]/;

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
        filter: 'published=true',
        fields: 'slug',
        requestKey: 'sitemap-pages'
      })
    );
    pageSlugs = (pages as Array<{ slug: string }>).map((p) => p.slug);
  } catch {
    // Graceful degradation — sitemap without pages
  }

  // Build exclude patterns dynamically — exclude [slug] route when no pages exist
  const excludeRoutePatterns = [...EXCLUDE_ROUTES, ...(pageSlugs.length === 0 ? [SLUG_ROUTE_PATTERN] : [])];

  return await response({
    origin,

    excludeRoutePatterns,

    paramValues:
      pageSlugs.length > 0
        ? {
            '/[slug]': pageSlugs
          }
        : undefined,

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
