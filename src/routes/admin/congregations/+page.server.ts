import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const status = url.searchParams.get('status') ?? 'all';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 20;

  // Build filter
  const filters: string[] = [];
  if (status === 'visible') filters.push('visible=true');
  else if (status === 'hidden') filters.push('visible=false');
  if (search) filters.push(`name ~ "${search.replace(/"/g, '\\"')}"`);
  const filter = filters.length > 0 ? filters.join(' && ') : '';

  const [list, pendingCount] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(page, perPage, {
        filter: filter || undefined,
        sort: '-created',
        expand: 'owner',
        requestKey: `admin-cong-${page}`
      })
    ),
    withRetry(() =>
      client.collection('congregations').getList(1, 1, {
        filter: 'visible=false',
        requestKey: 'admin-cong-pending'
      })
    )
  ]);

  return {
    congregations: list.items.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      denomination: c.denomination,
      visible: c.visible,
      city: c.city,
      state: c.state,
      country: c.country,
      owner:
        ((c as Record<string, unknown>).expand as Record<string, { email?: string }> | undefined)?.owner?.email ?? '',
      created: c.created
    })),
    total: list.totalItems,
    page,
    perPage,
    search,
    status,
    pendingApprovals: pendingCount.totalItems
  };
};
