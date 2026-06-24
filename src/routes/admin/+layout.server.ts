import { redirect } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  // Load sidebar stats for the dashboard
  const [congCount, userCount, pendingCount] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=true', requestKey: 'admin-cong-count' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'admin-user-count' })),
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=false', requestKey: 'admin-pending-count' })
    )
  ]);

  return {
    stats: {
      congregations: congCount.totalItems,
      users: userCount.totalItems,
      pendingApprovals: pendingCount.totalItems
    },
    user: client.authStore.record
  };
};
