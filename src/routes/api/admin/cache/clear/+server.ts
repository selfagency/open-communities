import { error, json } from '@sveltejs/kit';
import { clearCongregationCache, clearCountriesCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ locals }) => {
  if (!locals.api?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }
  clearCountriesCache();
  clearCongregationCache();
  return json({ success: true });
};
