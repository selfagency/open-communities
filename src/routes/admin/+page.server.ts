import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const { api } = event.locals;

  const [congregationResult, userResult, pendingResult] = await Promise.all([
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=true' })),
    withRetry(() => api.collection('users').getList(1, 1)),
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=false' }))
  ]);

  return {
    title: 'Dashboard',
    stats: {
      congregations: congregationResult.totalItems,
      users: userResult.totalItems,
      pendingApprovals: pendingResult.totalItems
    }
  };
};
