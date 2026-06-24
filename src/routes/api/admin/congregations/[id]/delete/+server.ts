import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');
  await client.collection('congregations').delete(params.id);
  return json({ success: true });
};
