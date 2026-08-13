import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 18;

  // Build filter — match email, name, or the linked congregation's name
  let filter = '';
  if (search) {
    filter = client.filter('email ~ {:search} || name ~ {:search} || congregation.name ~ {:search}', { search });
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
    // fallow-ignore-next-line unused-load-data-key -- consumed by UserList component via {data} pass-through
    users: list.items.map((u) => {
      const expand = u.expand as unknown as { congregation?: Record<string, unknown> } | undefined;
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
    // fallow-ignore-next-line unused-load-data-key -- unused by page, returned for pagination state
    total: list.totalItems,
    // fallow-ignore-next-line unused-load-data-key -- consumed by pagination component
    page,
    // fallow-ignore-next-line unused-load-data-key -- consumed by pagination component
    perPage,
    // fallow-ignore-next-line unused-load-data-key -- consumed by search filter
    search
  };
};
