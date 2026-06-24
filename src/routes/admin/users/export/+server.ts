import type { RequestHandler } from './$types';
import { withRetry } from '$lib/server/api';

export const GET: RequestHandler = async ({ locals }) => {
  const { api } = locals;
  const users = await withRetry(() => api.collection('users').getFullList({ sort: 'email' }));

  const headers = 'Name,Email,Language,Verified,Admin,Congregation,Created\n';
  const rows = users
    .map(
      (u) =>
        `"${u.name || ''}","${u.email}","${u.lang || 'en'}",${u.verified},${u.admin},"${u.congregation || ''}","${u.created}"`
    )
    .join('\n');

  return new Response(headers + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="users.csv"'
    }
  });
};
