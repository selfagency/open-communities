import { withRetry } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const client = locals.api;
  const search = url.searchParams.get('q') ?? '';
  const page = Number(url.searchParams.get('page')) || 1;
  const perPage = 20;

  // Build filter
  let filter = '';
  if (search) {
    const escaped = search.replace(/"/g, '\\"');
    filter = `email ~ "${escaped}" || name ~ "${escaped}"`;
  }

  const list = await withRetry(() =>
    client.collection('users').getList(page, perPage, {
      filter: filter || undefined,
      sort: '-created',
      requestKey: `admin-users-${page}`
    })
  );

  return {
    users: list.items.map((u: Record<string, unknown>) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      lang: u.lang,
      verified: u.verified,
      admin: u.admin,
      created: u.created
    })),
    total: list.totalItems,
    page,
    perPage,
    search
  };
};
