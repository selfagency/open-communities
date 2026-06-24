import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  const { api } = locals;
  const { id } = params;

  const cong = await api.collection('congregations').getOne(id);
  await api.collection('congregations').update(id, { visible: !cong.visible });

  return json({ success: true });
};
