import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  depends('dashboard:stats');
  const client = locals.api;

  const [congCount, userCount, pendingCount] = await Promise.all([
    withRetry(() =>
      client
        .collection('congregationMeta')
        .getList(1, 1, { filter: client.filter('visible={:v}', { v: true }), requestKey: 'dash-cong' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'dash-users' })),
    withRetry(() =>
      client
        .collection('congregationMeta')
        .getList(1, 1, { filter: client.filter('visible={:v}', { v: false }), requestKey: 'dash-pending' })
    )
  ]);

  return {
    stats: {
      congregations: congCount.totalItems,
      pendingApprovals: pendingCount.totalItems,
      users: userCount.totalItems
    }
  };
};
