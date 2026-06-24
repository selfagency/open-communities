import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  return {};
};
