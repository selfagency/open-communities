import { withRetry } from '$lib/server/api';
import { getWeeklyDigest } from '$lib/server/posthog-api';
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

  const [monthDigest, realtimeDigest, weekDigest] = await Promise.all([
    getWeeklyDigest(30).catch(() => null),
    getWeeklyDigest(1).catch(() => null),
    getWeeklyDigest(7).catch(() => null)
  ]);

  // Geographic stats
  const [allCountries, allStates] = await Promise.all([
    withRetry(() =>
      client.collection('countries').getFullList({ sort: '-created', requestKey: 'dash-countries' })
    ).catch(() => []),
    withRetry(() => client.collection('states').getFullList({ sort: '-created', requestKey: 'dash-states' })).catch(
      () => []
    )
  ]);

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
  for (const cong of allCongs as Record<string, unknown>[]) {
    const coId = cong.country as string;
    const stId = cong.state as string;
    if (coId) {
      countryCounts[coId] = (countryCounts[coId] || 0) + 1;
    }
    if (stId) {
      stateCounts[stId] = (stateCounts[stId] || 0) + 1;
    }
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

  return {
    stats: {
      congregations: congCount.totalItems,
      users: userCount.totalItems,
      pendingApprovals: pendingCount.totalItems,
      topCountries,
      topStates
    },
    monthDigest,
    realtimeDigest,
    weekDigest
  };
};
