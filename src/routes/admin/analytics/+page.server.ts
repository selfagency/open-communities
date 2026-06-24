import type { PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
  const { api } = event.locals;

  const [congregationResult, userResult, pendingResult] = await Promise.all([
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=true' })),
    withRetry(() => api.collection('users').getList(1, 1)),
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=false' }))
  ]);

  return {
    title: 'Analytics',
    stats: {
      congregations: congregationResult.totalItems,
      users: userResult.totalItems,
      pendingApprovals: pendingResult.totalItems
    }
  };
};
