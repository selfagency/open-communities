import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface CongView {
  created: string;
  denomination: string;
  expand?: Record<string, unknown>;
  id: string;
  location?: Record<string, Record<string, string> | undefined>;
  name: string;
  visible: boolean;
}

function parseLocation(loc: unknown): { city: string; state: string; countryCode: string } {
  if (!loc || typeof loc !== 'object') {
    return { city: '', state: '', countryCode: '' };
  }
  const data = loc as Record<string, Record<string, string> | undefined>;
  return {
    city: data?.city?.name ?? '',
    state: data?.state?.name ?? '',
    countryCode: data?.country?.code ?? ''
  };
}

function mapCong(c: CongView) {
  const expand = c.expand as Record<string, Record<string, string> | undefined> | undefined;
  const loc = parseLocation(c.location);
  return {
    id: c.id as string,
    name: c.name as string,
    denomination: c.denomination as string,
    visible: c.visible as boolean,
    city: loc.city,
    state: loc.state,
    countryCode: loc.countryCode,
    owner: (expand?.owner?.email as string) ?? '',
    ownerId: (expand?.owner?.id as string) ?? '',
    ownerName: (expand?.owner?.name as string) ?? '',
    created: c.created as string
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  const [active, pending] = await Promise.all([
    withRetry(() =>
      client.collection('congregationMeta').getFullList({
        filter: client.filter('visible={:v}', { v: true }),
        sort: '-created',
        expand: 'owner',
        requestKey: 'admin-cong-active'
      })
    ),
    withRetry(() =>
      client.collection('congregationMeta').getFullList({
        filter: client.filter('visible={:v}', { v: false }),
        sort: '-created',
        expand: 'owner',
        requestKey: 'admin-cong-pending'
      })
    )
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
