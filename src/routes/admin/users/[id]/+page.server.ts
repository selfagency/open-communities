import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw redirect(303, '/');

  const userId = params.id;
  let user: Record<string, unknown>;
  try {
    user = await client.collection('users').getOne(userId, { expand: 'congregation' });
  } catch {
    throw error(404, 'User not found');
  }

  const expand = user.expand as Record<string, unknown> | undefined;
  const congData = (expand?.congregation as Record<string, string> | undefined) || null;

  const available = await client
    .collection('congregations')
    .getFullList({
      filter: 'owner = null',
      sort: 'name',
      requestKey: 'admin-user-avail-congs'
    })
    .catch(() => []);

  return {
    targetUser: {
      id: user.id as string,
      name: (user.name as string) ?? '',
      email: (user.email as string) ?? '',
      verified: (user.verified as boolean) ?? false,
      admin: (user.admin as boolean) ?? false,
      congregation: (user.congregation as string) ?? '',
      congregationName: congData?.name ?? ''
    },
    availableCongregations: (available as Array<Record<string, unknown>>).map((c) => ({
      id: c.id as string,
      name: c.name as string
    }))
  };
};

export const actions = {
  update: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) return fail(400, { error: 'Name and email are required' });

    try {
      await client.collection('users').update(params.id, { name, email });
      return { success: 'User updated' };
    } catch (err: unknown) {
      return fail(400, { error: (err as { message?: string }).message ?? 'Update failed' });
    }
  },

  unlink: async ({ locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    try {
      await client.collection('users').update(params.id, { congregation: null });
      return { success: 'Congregation unlinked' };
    } catch {
      return fail(400, { error: 'Failed to unlink congregation' });
    }
  },

  deleteAccount: async ({ locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    try {
      await client.collection('users').delete(params.id);
      throw redirect(303, '/admin/users');
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 303) throw err;
      return fail(400, { error: 'Failed to delete account' });
    }
  },

  assign: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    const formData = await request.formData();
    const congregationId = formData.get('congregationId') as string;

    if (!congregationId) return fail(400, { error: 'No congregation selected' });

    try {
      await client.collection('users').update(params.id, { congregation: congregationId });
      return { success: 'Congregation assigned' };
    } catch {
      return fail(400, { error: 'Failed to assign congregation' });
    }
  },

  resetPassword: async ({ locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw redirect(303, '/');

    try {
      const user = await client.collection('users').getOne(params.id);
      await client.collection('users').requestPasswordReset(user.email as string, { fetch });
      return { success: 'Password reset email sent' };
    } catch {
      return fail(400, { error: 'Failed to send password reset' });
    }
  }
} satisfies Actions;
