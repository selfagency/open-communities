import { json, redirect } from '@sveltejs/kit';
import { clearCongregationCache, clearCountriesCache } from '$lib/server/cache';
import type { RequestHandler } from './$types';

// biome-ignore lint/suspicious/useAwait: SvelteKit async signature
export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.api?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }
  clearCountriesCache();
  clearCongregationCache();
  return json({ success: true });
};
