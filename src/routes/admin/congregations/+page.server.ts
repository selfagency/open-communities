import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 20;

  const filters: string[] = [];
  if (search) filters.push(`name ~ "${search.replace(/"/g, '\\"')}"`);

  // Active congregations (visible=true)
  const activeFilter = ['visible=true', ...filters].join(' && ');
  const [active, pending] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(page, perPage, {
        filter: activeFilter || undefined,
        sort: '-created',
        expand: 'owner',
        requestKey: `admin-cong-${page}`
      })
    ),
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=false',
        sort: '-created',
        expand: 'owner',
        requestKey: 'admin-cong-pending'
      })
    )
  ]);

  function mapCong(c: Record<string, unknown>) {
    return {
      id: c.id as string,
      name: c.name as string,
      denomination: c.denomination as string,
      city: c.city as string,
      state: c.state as string,
      owner:
        ((c as Record<string, unknown>).expand as Record<string, { email?: string }> | undefined)?.owner?.email ?? '',
      created: c.created as string
    };
  }

  return {
    active: active.items.map(mapCong),
    total: active.totalItems,
    page,
    perPage,
    search,
    pending: pending.map(mapCong)
  };
};
