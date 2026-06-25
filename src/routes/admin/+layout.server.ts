import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  const client = locals.api;

  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  return {};
};
