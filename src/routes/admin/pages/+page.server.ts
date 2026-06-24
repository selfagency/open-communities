import type { PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals }) => {
  const { api } = locals;

  const result = await withRetry(() => api.collection('pages').getList(1, 50, { sort: '-created' }));

  return {
    title: 'Pages',
    pages: result.items
  };
};
