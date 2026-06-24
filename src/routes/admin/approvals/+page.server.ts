import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const tab = url.searchParams.get('tab') ?? 'new';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 20;

  const filter = tab === 'new' ? 'visible=false' : 'visible=true';
  const list = await withRetry(() =>
    client.collection('congregations').getList(page, perPage, {
      filter,
      sort: '-created',
      expand: 'owner',
      requestKey: `admin-approve-${tab}-${page}`
    })
  );

  return {
    congregations: list.items.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      denomination: c.denomination,
      owner: (c as any).expand?.owner?.email ?? '',
      created: c.created
    })),
    total: list.totalItems,
    tab,
    page,
    perPage
  };
};
