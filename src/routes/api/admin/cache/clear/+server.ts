import { json } from '@sveltejs/kit';
import { clearCongregationCache, clearCountriesCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  clearCountriesCache();
  clearCongregationCache();
  return json({ success: true });
};
