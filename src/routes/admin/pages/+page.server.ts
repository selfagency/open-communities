import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const pages = await withRetry(() =>
    client.collection('pages').getFullList({ sort: '-updated', requestKey: 'admin-pages' })
  );
  return {
    pages: pages.map((p: unknown) => ({
      id: (p as Record<string, unknown>).id as string,
      title: (p as Record<string, unknown>).title as string,
      slug: (p as Record<string, unknown>).slug as string,
      description: ((p as Record<string, unknown>).description as string) ?? '',
      imageAlt: ((p as Record<string, unknown>).imageAlt as string) ?? '',
      imageCaption: ((p as Record<string, unknown>).imageCaption as string) ?? '',
      updated: (p as Record<string, unknown>).updated as string
    }))
  };
};
