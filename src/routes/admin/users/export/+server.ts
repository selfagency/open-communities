import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;
  const users = await withRetry(() =>
    client.collection('users').getFullList({ sort: '-created', requestKey: 'admin-export-users' })
  );
  const csv =
    ['name,email,lang,verified,admin,'] +
    users.map((u: any) => `"${u.name || ''}","${u.email}",${u.lang || 'en'},${u.verified},${u.admin}`).join('\n');
  return new Response(csv, {
    headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename=users.csv' }
  });
};
