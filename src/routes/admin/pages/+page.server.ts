import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const pages = await withRetry(() =>
    client.collection('pages').getFullList({ sort: '-updated', requestKey: 'admin-pages' })
  );
  return {
    pages: pages.map((p: Record<string, unknown>) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      lang: p.lang,
      published: p.published,
      updated: p.updated
    }))
  };
};
