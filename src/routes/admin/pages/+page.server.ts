import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const pages = await withRetry(() =>
    client.collection('pages').getFullList({ sort: '-updated', requestKey: 'admin-pages' })
  );
  return {
    pages: pages.map((p) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      description: (p.description as string) ?? '',
      imageAlt: (p.imageAlt as string) ?? '',
      imageCaption: (p.imageCaption as string) ?? '',
      updated: p.updated as string
    }))
  };
};
