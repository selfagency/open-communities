import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const { locals } = event;
  const client = locals.api?.authStore?.record;

  if (!client?.admin) {
    throw redirect(303, '/');
  }

  return {
    title: 'Dashboard',
    user: client
  };
};
