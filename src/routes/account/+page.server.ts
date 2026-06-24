import { error, fail } from '@sveltejs/kit';
import type { RecordModel } from 'pocketbase';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userSchema } from '$lib/schemas/user';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const user = client.authStore.record;
  if (!user?.email) throw error(401, 'Not authenticated');
  const form = await superValidate(zod4(userSchema), {
    defaults: {
      name: (user?.name as string) ?? '',
      email: (user?.email as string) ?? '',
      emailVisibility: true,
      lang: (user?.lang as 'en' | 'es' | 'fr' | 'he' | 'de' | 'hu' | 'nl' | 'pl' | 'pt' | 'ru' | 'uk') ?? 'en',
      notifications: (user?.notifications as boolean) ?? true,
      congregation: (user?.congregation as string) ?? '',
      password: '',
      passwordConfirm: '',
      oldPassword: ''
    }
  });
  return { form, user };
};

export const actions = {
  update: async (event) => {
    const { locals, request } = event;
    const client = locals.api;
    const form = await superValidate(request, zod4(userSchema));

    if (!form.valid) return fail(400, { form });

    try {
      const body: Record<string, unknown> = {
        name: form.data.name,
        lang: form.data.lang,
        notifications: form.data.notifications
      };
      if (form.data.password) {
        body.oldPassword = form.data.oldPassword;
        body.password = form.data.password;
        body.passwordConfirm = form.data.passwordConfirm;
      }
      const updated = await client.collection('users').update(client.authStore.record?.id as string, body);
      client.authStore.save(client.authStore.token, updated as unknown as RecordModel);
      return { form, success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Update failed';
      setError(form, '', msg);
      return fail(400, { form });
    }
  },

  unlink: async ({ locals }) => {
    const client = locals.api;
    await client.collection('users').update(client.authStore.record?.id as string, { congregation: null });
    return { unlinked: true };
  },

  deleteAccount: async ({ locals }) => {
    const client = locals.api;
    const id = client.authStore.record?.id as string;
    await client.collection('users').delete(id);
    client.authStore.clear();
    return { deleted: true };
  }
} satisfies Actions;
