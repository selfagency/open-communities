import { error, fail, redirect } from '@sveltejs/kit';
import type { RecordModel } from 'pocketbase';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { userSchema } from '$lib/schemas/user';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const client = locals.api;
  const user = client.authStore.record;
  if (!user?.email) {
    throw error(401, 'Not authenticated');
  }
  const defaults = {
    congregation: (user.congregation as string) || '',
    email: (user.email as string) || '',
    emailVisibility: true,
    lang: (user.lang as 'en' | 'es' | 'fr' | 'he' | 'de' | 'hu' | 'nl' | 'pl' | 'pt' | 'ru' | 'uk') || 'en',
    name: (user.name as string) || '',
    notifications: (user.notifications as boolean | undefined) ?? true,
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  };
  const form = await superValidate(zod4(userSchema), { defaults });
  return { form, user };
};

export const actions = {
  deleteAccount: async ({ cookies, locals }) => {
    const client = locals.api;
    const uid = client.authStore?.record?.id;
    if (!uid) {
      throw error(401, 'Not authenticated');
    }
    await withRetry(() => client.collection('users').delete(uid));
    client.authStore.clear();
    cookies.set('auth', '', { ...locals.cookieOpts, maxAge: 0 });
    cookies.set('session', '', { ...locals.cookieOpts, maxAge: 0 });
    throw redirect(303, '/');
  },

  unlink: async ({ locals }) => {
    const client = locals.api;
    const uid = client.authStore?.record?.id;
    if (!uid) {
      throw error(401, 'Not authenticated');
    }
    await withRetry(() => client.collection('users').update(uid, { congregation: '' }));
    return { unlinked: true };
  },
  update: async (event) => {
    const { locals, request } = event;
    const client = locals.api;
    const form = await superValidate(request, zod4(userSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const uid = client.authStore.record?.id;
    if (!uid) {
      return fail(401, { form });
    }

    try {
      const body: Record<string, unknown> = {
        lang: form.data.lang,
        name: form.data.name,
        notifications: form.data.notifications
      };
      if (form.data.password) {
        body.oldPassword = form.data.oldPassword;
        body.password = form.data.password;
        body.passwordConfirm = form.data.passwordConfirm;
      }
      const updated = await withRetry(() => client.collection('users').update(uid, body));
      client.authStore.save(client.authStore.token, updated as unknown as RecordModel);
      return { form, success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Update failed';
      setError(form, '', msg);
      return fail(400, { form });
    }
  }
} satisfies Actions;
