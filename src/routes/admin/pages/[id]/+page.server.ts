import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

const pageEditSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9-]+$/),
  content: z.string().optional(),
  description: z.string().optional(),
  lang: z.enum(['en', 'de', 'es', 'fr', 'he'])
});

export const load: PageServerLoad = async ({ locals, params }) => {
  const { api } = locals;
  const page = await withRetry(() => api.collection('pages').getOne(params.id));
  const form = await superValidate(zod4(pageEditSchema));

  return {
    title: `Edit Page: ${page.title}`,
    form,
    page
  };
};

export const actions: Actions = {
  default: async ({ locals, request, params }) => {
    const { api } = locals;
    const form = await superValidate(request, zod4(pageEditSchema));
    if (!form.valid) return fail(400, { form });

    await api.collection('pages').update(params.id, form.data);
    return { form };
  },

  delete: async ({ locals, params }) => {
    const { api } = locals;
    await api.collection('pages').delete(params.id);
    return { success: true };
  }
};
