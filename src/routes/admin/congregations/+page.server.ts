import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { api } = locals;
  const page = Number(url.searchParams.get('page') || '1');
  const perPage = 20;
  const status = url.searchParams.get('status') || 'all';
  const denomination = url.searchParams.get('denomination') || '';

  let filter = '';
  const filterParts: string[] = [];

  if (status === 'visible') filterParts.push('visible=true');
  else if (status === 'hidden') filterParts.push('visible=false');

  if (denomination) filterParts.push(`denomination='${denomination}'`);

  if (filterParts.length > 0) filter = filterParts.join(' && ');

  const result = await withRetry(() =>
    api.collection('congregationMeta').getList(page, perPage, {
      filter: filter || undefined,
      sort: '-created'
    })
  );

  return {
    title: 'Congregations',
    congregations: result.items,
    total: result.totalItems,
    page,
    perPage
  };
};
