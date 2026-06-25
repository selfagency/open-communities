import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

function mapCong(c: Record<string, unknown>) {
  const expand = c.expand as Record<string, unknown> | undefined;
  const cityData = expand?.city as Record<string, string> | undefined;
  const stateData = expand?.state as Record<string, string> | undefined;
  const countryData = stateData?.country as Record<string, string> | undefined;
  return {
    id: c.id as string,
    name: c.name as string,
    denomination: c.denomination as string,
    visible: c.visible as boolean,
    city: cityData?.name ?? '',
    state: stateData?.name ?? '',
    countryCode: countryData?.code ?? '',
    owner: ((c.expand as Record<string, Record<string, string> | undefined> | undefined)?.owner?.email as string) ?? '',
    ownerId: ((c.expand as Record<string, Record<string, string> | undefined> | undefined)?.owner?.id as string) ?? '',
    created: c.created as string
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  const expandStr = 'owner,city,state,state.country';

  const [active, pending] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=true',
        sort: '-created',
        expand: expandStr,
        requestKey: 'admin-cong-active'
      })
    ),
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=false',
        sort: '-created',
        expand: expandStr,
        requestKey: 'admin-cong-pending'
      })
    )
  ]);

  // fallow-ignore-next-line unused-load-data-keys
  return {
    congregations: [...active.map(mapCong), ...pending.map(mapCong)],
    pending: pending.map(mapCong)
  };
};
