import { redirect } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

function csvEscape(val: unknown): string {
  const s = typeof val === 'string' ? val : String(val ?? '');
  return `"${s.replaceAll('"', '""')}"`;
}

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw redirect(303, '/');

  const users = await withRetry(() =>
    client.collection('users').getFullList({
      sort: '-created',
      expand: 'congregation,congregation.city,congregation.state,congregation.country',
      requestKey: 'admin-export-users'
    })
  );
  const header = 'name,email,email_opted_out,congregation,congregation_city,congregation_state,congregation_country';
  const rows = users
    .map((u: Record<string, unknown>) => {
      const expand = u.expand as Record<string, unknown> | undefined;
      const congData = expand?.congregation as Record<string, unknown> | undefined;
      const congExpand = congData?.expand as Record<string, unknown> | undefined;
      const cityData = congExpand?.city as Record<string, string> | undefined;
      const stateData = congExpand?.state as Record<string, string> | undefined;
      const countryData = congExpand?.country as Record<string, string> | undefined;
      const optedOut = u.notifications === false ? 'true' : 'false';
      return `${csvEscape(u.name)},${csvEscape(u.email)},${csvEscape(optedOut)},${csvEscape(congData?.name ?? '')},${csvEscape(cityData?.name ?? '')},${csvEscape(stateData?.name ?? '')},${csvEscape(countryData?.name ?? '')}`;
    })
    .join('\n');
  const csv = `${header}\n${rows}`;
  return new Response(csv, {
    headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename=users.csv' }
  });
};
