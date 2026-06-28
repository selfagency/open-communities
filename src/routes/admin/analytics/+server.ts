import { error, json } from '@sveltejs/kit';
import { getWeeklyDigest } from '$lib/server/posthog-api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const [monthDigest, realtimeDigest, weekDigest] = await Promise.all([
    getWeeklyDigest(30).catch(() => null),
    getWeeklyDigest(1).catch(() => null),
    getWeeklyDigest(7).catch(() => null)
  ]);

  return json({ monthDigest, realtimeDigest, weekDigest });
};
