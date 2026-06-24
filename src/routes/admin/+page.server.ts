import { withRetry } from '$lib/server/api';
import { getWeeklyDigest, queryHogQL } from '$lib/server/posthog-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  const [congCount, userCount, pendingCount, countries, states] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=true', requestKey: 'dash-cong' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'dash-users' })),
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=false', requestKey: 'dash-pending' })
    ),
    withRetry(() =>
      client
        .collection('countriesByQty')
        .getList(1, 5, { sort: '-congregation_count', requestKey: 'dash-countries' })
        .catch(() => ({ items: [] }))
    ),
    withRetry(() =>
      client
        .collection('statesByQty')
        .getList(1, 5, { sort: '-congregation_count', requestKey: 'dash-states', filter: "country_code='US'" })
        .catch(() => ({ items: [] }))
    )
  ]);

  const weeklyDigest = await getWeeklyDigest(30).catch(() => null);

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

  return {
    stats: {
      congregations: congCount.totalItems,
      users: userCount.totalItems,
      pendingApprovals: pendingCount.totalItems,
      topCountries: countries.items.map((c: Record<string, unknown>) => ({
        name: c.country_name,
        count: c.congregation_count
      })),
      topStates: states.items.map((s: Record<string, unknown>) => ({ name: s.state_name, count: s.congregation_count }))
    },
    weeklyDigest,
    dailyTrend
  };
};
