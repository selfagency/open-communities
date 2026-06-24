import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;

  function mapCong(c: Record<string, unknown>) {
    return {
      id: c.id as string,
      name: c.name as string,
      denomination: c.denomination as string,
      visible: c.visible as boolean,
      city: c.city as string,
      state: c.state as string,
      owner:
        ((c as Record<string, unknown>).expand as Record<string, { email?: string }> | undefined)?.owner?.email ?? '',
      created: c.created as string
    };
  }

  const [active, pending] = await Promise.all([
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=true',
        sort: '-created',
        expand: 'owner',
        requestKey: 'admin-cong-active'
      })
    ),
    withRetry(() =>
      client.collection('congregations').getFullList({
        filter: 'visible=false',
        sort: '-created',
        expand: 'owner',
        requestKey: 'admin-cong-pending'
      })
    )
  ]);

  return {
    congregations: [...active.map(mapCong), ...pending.map(mapCong)],
    active: active.map(mapCong),
    pending: pending.map(mapCong)
  };
};
