import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  const cong = await client.collection('congregations').getOne(params.id);
  await client.collection('congregations').update(params.id, { visible: !cong.visible });
  return json({ success: true });
};
