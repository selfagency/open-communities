import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');
  const cong = await client.collection('congregations').getOne(params.id);
  await client.collection('congregations').update(params.id, { visible: !cong.visible });
  return json({ success: true });
};
