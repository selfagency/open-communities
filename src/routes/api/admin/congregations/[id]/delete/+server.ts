import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  await client.collection('congregations').delete(params.id);
  return json({ success: true });
};
