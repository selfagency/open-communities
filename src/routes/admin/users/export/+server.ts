import { redirect } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw redirect(303, '/');

  const users = await withRetry(() =>
    client
      .collection('users')
      .getFullList({ sort: '-created', filter: 'notifications=true', requestKey: 'admin-export-users' })
  );
  const header = 'name,email,lang,verified,admin';
  const rows = users
    .map(
      (u: Record<string, unknown>) =>
        `${csvEscape(u.name)},${csvEscape(u.email)},${csvEscape(u.lang)},${csvEscape(u.verified)},${csvEscape(u.admin)}`
    )
    .join('\n');
  const csv = `${header}\n${rows}`;
  return new Response(csv, {
    headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename=users.csv' }
  });
};
