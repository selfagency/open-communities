import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface CongView {
  created: string;
  denomination: string;
  expand?: Record<string, unknown>;
  id: string;
  name: string;
  visible: boolean;
}

function mapCong(c: CongView) {
  const expand = c.expand as Record<string, Record<string, string> | undefined> | undefined;
  return {
    id: c.id as string,
    name: c.name as string,
    denomination: c.denomination as string,
    visible: c.visible as boolean,
    city: (expand?.city as Record<string, string> | undefined)?.name ?? '',
    state: (expand?.state as Record<string, string> | undefined)?.name ?? '',
    countryCode: (expand?.['state.country'] as Record<string, string> | undefined)?.code ?? '',
    owner: (expand?.owner?.email as string) ?? '',
    ownerId: (expand?.owner?.id as string) ?? '',
    ownerName: (expand?.owner?.name as string) ?? '',
    created: c.created as string
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  const expand = 'owner,city,state,state.country';

  const [active, pending] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: client.filter('visible={:v}', { v: true }),
        sort: '-created',
        expand,
        requestKey: 'admin-cong-active'
      })
    ).catch(() => [] as never[]),
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: client.filter('visible={:v}', { v: false }),
        sort: '-created',
        expand,
        requestKey: 'admin-cong-pending'
      })
    ).catch(() => [] as never[])
  ]);

  return {
    congregations: [
      ...active.map((c) => mapCong(c as unknown as CongView)),
      ...pending.map((c) => mapCong(c as unknown as CongView))
    ],
    // fallow-ignore-next-line unused-load-data-key -- consumed by CongregationList component
    pending: pending.map((c) => mapCong(c as unknown as CongView))
  };
};
