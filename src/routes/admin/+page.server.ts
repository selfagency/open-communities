import { withRetry } from '$lib/server/api';
import { getWeeklyDigest } from '$lib/server/posthog-api';
import type { PageServerLoad } from './$types';

interface CountriesByQtyView {
  congregation_count: number;
  country_code: string;
  country_flag: string;
  country_name: string;
  id: string;
}

interface StatesByQtyView {
  congregation_count: number;
  country_name: string;
  id: string;
  state_code: string;
  state_name: string;
}

export const load: PageServerLoad = async ({ locals, depends }) => {
  depends('dashboard:stats');
  const client = locals.api;

  const [congCount, userCount, pendingCount] = await Promise.all([
    withRetry(() =>
      client
        .collection('congregations')
        .getList(1, 1, { filter: client.filter('visible={:v}', { v: true }), requestKey: 'dash-cong' })
    ),
    withRetry(() => client.collection('users').getList(1, 1, { requestKey: 'dash-users' })),
    withRetry(() =>
      client
        .collection('congregations')
        .getList(1, 1, { filter: client.filter('visible={:v}', { v: false }), requestKey: 'dash-pending' })
    )
  ]);

  const [monthDigest, realtimeDigest, weekDigest] = await Promise.all([
    getWeeklyDigest(30).catch(() => null),
    getWeeklyDigest(1).catch(() => null),
    getWeeklyDigest(7).catch(() => null)
  ]);

  // Geographic stats from pre-computed views
  const [countriesByQty, statesByQty] = await Promise.all([
    withRetry(() =>
      client.collection('countriesByQty').getFullList({ sort: '-congregation_count', requestKey: 'dash-countries-qty' })
    ).catch(() => []),
    withRetry(() =>
      client.collection('statesByQty').getFullList({
        filter: client.filter('country_code={:code}', { code: 'US' }),
        sort: '-congregation_count',
        requestKey: 'dash-states-qty'
      })
    ).catch(() => [])
  ]);

  const topCountries = (countriesByQty as unknown as CountriesByQtyView[])
    .slice(0, 5)
    .map((c) => ({ name: c.country_name || '', count: c.congregation_count ?? 0 }));

  const topStates = (statesByQty as unknown as StatesByQtyView[])
    .slice(0, 5)
    .map((s) => ({ name: s.state_name || '', count: s.congregation_count ?? 0 }));

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
