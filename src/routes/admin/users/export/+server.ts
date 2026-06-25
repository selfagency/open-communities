import { error } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import type { RequestHandler } from './$types';

const CSV_LEADING_FORMULA_RE = /^[=+\-@\t\r]/;

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }
  let s: string;
  if (typeof val === 'string') {
    s = val;
  } else if (typeof val === 'number' || typeof val === 'boolean') {
    s = String(val);
  } else {
    return '""';
  }
  // OWASP CSV injection mitigation: prefix leading =,+,-,@ with single quote
  if (CSV_LEADING_FORMULA_RE.test(s)) {
    s = `'${s}`;
  }
  return `"${s.replaceAll('"', '""')}"`;
}

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const users = await withRetry(() =>
    client.collection('users').getFullList({
      sort: '-created',
      expand: 'congregation,congregation.city,congregation.state,congregation.country',
      requestKey: 'admin-export-users'
    })
  );
  const header = 'name,email,email_opted_out,congregation,congregation_city,congregation_state,congregation_country';
  const rows = users
    .map((u) => {
      const expand = u.expand as unknown as Record<string, unknown> | undefined;
      const congData = expand?.congregation as unknown as Record<string, unknown> | undefined;
      const congExpand = congData?.expand as unknown as Record<string, unknown> | undefined;
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
