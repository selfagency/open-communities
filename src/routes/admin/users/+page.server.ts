import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 18;

  // Build filter
  let filter = '';
  if (search) {
    filter = client.filter('email ~ {:search} || name ~ {:search}', { search });
  }

  const list = await withRetry(() =>
    client.collection('users').getList(page, perPage, {
      filter: filter || undefined,
      sort: 'name',
      expand: 'congregation',
      requestKey: `admin-users-${page}`
    })
  );

  return {
    users: list.items.map((u: Record<string, unknown>) => {
      const expand = u.expand as Record<string, unknown> | undefined;
      const congData = expand?.congregation as Record<string, string> | undefined;
      return {
        id: u.id as string,
        name: (u.name as string) ?? '',
        email: (u.email as string) ?? '',
        verified: (u.verified as boolean) ?? false,
        admin: (u.admin as boolean) ?? false,
        congregation: (u.congregation as string) ?? '',
        congregationName: congData?.name ?? ''
      };
    }),
    total: list.totalItems,
    page,
    perPage,
    search
  };
};
