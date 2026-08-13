import type { PagesRecord } from '$lib/pocketbase.d';
import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 50;

  const result = await withRetry(() =>
    client.collection('pages').getList(page, perPage, { requestKey: 'admin-pages', sort: '-updated' })
  );

  return {
    // fallow-ignore-next-line unused-load-data-key -- consumed by PageList component via {data} pass-through
    pages: (result.items as PagesRecord[]).map((p) => ({
      description: p.description ?? '',
      id: p.id,
      published: p.published ?? false,
      slug: p.slug,
      title: p.title,
      updated: p.updated
    })),
    // fallow-ignore-next-line unused-load-data-key -- consumed by PageList component via {data} pass-through
    totalPages: result.totalPages
  };
};
