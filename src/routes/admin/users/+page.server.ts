import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { api } = locals;
  const page = Number(url.searchParams.get('page') || '1');
  const perPage = 20;
  const search = url.searchParams.get('q') || '';
  const filterAdmin = url.searchParams.get('admin') || '';

  let filter = '';
  const filterParts: string[] = [];

  if (search) filterParts.push(`email~"${search}" || name~"${search}"`);
  if (filterAdmin === 'true') filterParts.push('admin=true');
  else if (filterAdmin === 'false') filterParts.push('admin=false');

  if (filterParts.length > 0) filter = filterParts.join(' && ');

  const result = await withRetry(() =>
    api.collection('users').getList(page, perPage, {
      filter: filter || undefined,
      sort: '-created'
    })
  );

  return {
    title: 'Users',
    users: result.items,
    total: result.totalItems,
    page,
    perPage
  };
};
