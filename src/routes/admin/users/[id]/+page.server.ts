import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const userEditSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  lang: z.enum(['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk']),
  admin: z.boolean().optional(),
  verified: z.boolean().optional()
});

export const load: PageServerLoad = async ({ locals, params }) => {
  const { api } = locals;
  const user = await withRetry(() => api.collection('users').getOne(params.id));
  const form = await superValidate({}, zod4(userEditSchema));

  return {
    title: `Edit User: ${user.name || user.email}`,
    form,
    user
  };
};

export const actions: Actions = {
  default: async ({ locals, request, params }) => {
    const { api } = locals;
    const form = await superValidate(request, zod4(userEditSchema));
    if (!form.valid) return fail(400, { form });

    await api.collection('users').update(params.id, form.data);
    return { form };
  },

  sendPasswordReset: async ({ locals, params }) => {
    const { api } = locals;
    await api.collection('users').requestPasswordReset(params.id);
    return { success: true };
  },

  delete: async ({ locals, params }) => {
    const { api } = locals;
    const user = await api.collection('users').getOne(params.id);
    if (user.congregation) {
      await api.collection('users').update(params.id, { congregation: null });
    }
    await api.collection('users').delete(params.id);
    return { success: true };
  }
};
