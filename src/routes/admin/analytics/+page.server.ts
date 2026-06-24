import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';
import { getWeeklyDigest, queryHogQL, isConfigured } from '$lib/server/posthog-api';

export const load: PageServerLoad = async (event) => {
  const { api } = event.locals;

  const [congregationResult, userResult, pendingResult] = await Promise.all([
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=true' })),
    withRetry(() => api.collection('users').getList(1, 1)),
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=false' }))
  ]);

  // Fetch PostHog analytics if configured
  let phDigest = null;
  let dailyTrend = null;

  if (isConfigured()) {
    const [digest, trend] = await Promise.all([
      getWeeklyDigest(30),
      queryHogQL(`
        SELECT
          toDate(timestamp) as day,
          count() as events
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day ASC
        LIMIT 31
      `)
    ]);
    phDigest = digest;
    dailyTrend = trend;
  }

  return {
    title: 'Analytics',
    stats: {
      congregations: congregationResult.totalItems,
      users: userResult.totalItems,
      pendingApprovals: pendingResult.totalItems
    },
    phDigest,
    dailyTrend:
      dailyTrend?.results?.map((r: Array<unknown>) => ({
        day: String(r[0] ?? ''),
        events: Number(r[1] ?? 0)
      })) ?? [],
    phConfigured: isConfigured()
  };
};
