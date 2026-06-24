import { withRetry } from '$lib/server/api';
import { getWeeklyDigest, queryHogQL } from '$lib/server/posthog-api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  const [congCount, userCount, pendingCount] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=true', requestKey: 'dash-cong' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'dash-users' })),
    withRetry(() =>
      client.collection('congregations').getList(1, 1, { filter: 'visible=false', requestKey: 'dash-pending' })
    )
  ]);

  const weeklyDigest = await getWeeklyDigest(30).catch(() => null);

  // Product analytics queries
  const [loginTrend, signupTrend, topPages] = await Promise.all([
    weeklyDigest ? queryTrends('login', 30, 'week').catch(() => null) : Promise.resolve(null),
    weeklyDigest ? queryTrends('$pageview', 30, 'day').catch(() => null) : Promise.resolve(null),
    weeklyDigest
      ? queryHogQL(`
          SELECT properties.$pathname, count(DISTINCT person_id) AS visitors
          FROM events
          WHERE event = '$pageview'
            AND timestamp >= now() - INTERVAL 30 DAY
          GROUP BY properties.$pathname
          ORDER BY visitors DESC
          LIMIT 10
        `).catch(() => null)
      : Promise.resolve(null)
  ]);

  // Geographic stats — query base tables directly (views may not auto-populate)
  const [allCountries, allStates] = await Promise.all([
    withRetry(() =>
      client.collection('countries').getFullList({ sort: '-created', requestKey: 'dash-countries' })
    ).catch(() => []),
    withRetry(() => client.collection('states').getFullList({ sort: '-created', requestKey: 'dash-states' })).catch(
      () => []
    )
  ]);

  // Count congregations per country/state using the full congregation list
  const allCongs =
    congCount.totalItems + pendingCount.totalItems > 0
      ? await withRetry(() => client.collection('congregations').getFullList({ requestKey: 'dash-cong-all' })).catch(
          () => []
        )
      : [];

  const countryCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  const countryMap: Record<string, string> = {};
  const stateCountryMap: Record<string, string> = {};
  for (const c of allCountries) {
    countryMap[c.id as string] = c.name as string;
  }
  for (const s of allStates) {
    stateCountryMap[s.id as string] = (s.country as string) || '';
  }
  for (const cong of allCongs as Array<Record<string, unknown>>) {
    const coId = cong.country as string;
    const stId = cong.state as string;
    if (coId) countryCounts[coId] = (countryCounts[coId] || 0) + 1;
    if (stId) stateCounts[stId] = (stateCounts[stId] || 0) + 1;
  }

  const topCountries = Object.entries(countryCounts)
    .map(([id, count]) => ({ name: countryMap[id] || id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topStates = Object.entries(stateCounts)
    .filter(([id]) => {
      const coId = stateCountryMap[id];
      const co = allCountries.find((c: Record<string, unknown>) => c.id === coId);
      return co && (co as Record<string, unknown>).code === 'US';
    })
    .map(([id, count]) => ({
      name:
        ((allStates.find((s: Record<string, unknown>) => s.id === id) as Record<string, unknown>)?.name as string) ||
        id,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
      topCountries,
      topStates
    },
    weeklyDigest,
    dailyTrend,
    loginTrend,
    topPages: topPages?.results
      ? (topPages.results as Array<[string, number]>).map(([path, visitors]) => ({ path, visitors }))
      : []
  };
};
