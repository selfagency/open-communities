import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

interface CongView {
  created: string;
  denomination: string;
  id: string;
  location: string;
  name: string;
  owner: string;
  visible: boolean;
}

function mapCong(c: CongView, users: Map<string, { email: string; id: string; name: string }>) {
  let loc: { city?: { name: string }; state?: { name: string; code: string }; country?: { code: string } } = {};
  try {
    loc = JSON.parse(c.location) as typeof loc;
  } catch {
    // ignore
  }
  const ownerData = c.owner ? users.get(c.owner) : undefined;
  return {
    id: c.id as string,
    name: c.name as string,
    denomination: c.denomination as string,
    visible: c.visible as boolean,
    city: loc?.city?.name ?? '',
    state: loc?.state?.name ?? '',
    countryCode: loc?.country?.code ?? '',
    owner: ownerData?.email ?? '',
    ownerId: ownerData?.id ?? '',
    ownerName: ownerData?.name ?? '',
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
        requestKey: 'admin-cong-active'
      })
    ).catch(() => [] as never[]),
    withRetry(() =>
      client.collection('congregationMeta').getFullList({
        filter: client.filter('visible={:v}', { v: false }),
        sort: '-created',
        requestKey: 'admin-cong-pending'
      })
    ).catch(() => [] as never[])
  ]);

  // Batch-fetch owner details for all unique owner IDs
  const ownerIds = [...new Set([...active, ...pending].map((c) => (c as CongView).owner).filter(Boolean))];
  const users = new Map<string, { email: string; id: string; name: string }>();
  if (ownerIds.length > 0) {
    const ownerFilter = ownerIds.map((id) => `id = '${id}'`).join(' || ');
    const ownerRecords = await withRetry(() =>
      client.collection('users').getFullList({
        filter: ownerFilter,
        fields: 'id,email,name',
        requestKey: 'admin-cong-owners'
      })
    ).catch(() => [] as never[]);
    for (const u of ownerRecords as Array<{ id: string; email: string; name: string }>) {
      users.set(u.id, u);
    }
  }

  return {
    congregations: [
      ...active.map((c) => mapCong(c as unknown as CongView, users)),
      ...pending.map((c) => mapCong(c as unknown as CongView, users))
    ],
    // fallow-ignore-next-line unused-load-data-key -- consumed by CongregationList component
    pending: pending.map((c) => mapCong(c as unknown as CongView, users))
  };
};
