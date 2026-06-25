import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// biome-ignore lint/suspicious/useAwait: SvelteKit async signature
export const load: LayoutServerLoad = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  return {};
};
