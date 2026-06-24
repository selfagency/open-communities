import { withRetry } from '$lib/server/api';
import { getWeeklyDigest, queryHogQL } from '$lib/server/posthog-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const weeklyDigest = await getWeeklyDigest(30).catch(() => null);

  // Daily trend data from HogQL
  let dailyTrend: Array<{ day: string; events: number }> = [];
  if (weeklyDigest) {
    try {
      const raw = await queryHogQL(`
        SELECT toStartOfDay(timestamp) AS day, count() AS events
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day
      `);
      dailyTrend = ((raw?.results ?? []) as Array<[string, number]>).map(([day, events]) => ({
        day: day?.slice(0, 10) ?? '',
        events: events ?? 0
      }));
    } catch {
      dailyTrend = [];
    }
  }

  const [congCount, userCount] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=true', requestKey: 'ana-cong' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'ana-users' }))
  ]);

  return {
    weeklyDigest,
    dailyTrend,
    stats: {
      congregations: congCount.totalItems,
      users: userCount.totalItems
    }
  };
};
