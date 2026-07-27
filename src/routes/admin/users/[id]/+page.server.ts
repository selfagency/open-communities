import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withRetry } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

/* region schemas */

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  verified: z.boolean().optional(),
  admin: z.boolean().optional()
});

const assignSchema = z.object({
  congregationId: z.string().min(1, 'Select a congregation')
});

/* endregion schemas */

/* region helpers */

// fallow-ignore-next-line complexity
function mapUserData(user: Record<string, unknown>) {
  const expand = user.expand as unknown as { congregation?: Record<string, unknown> } | undefined;
  const congData = (expand?.congregation as Record<string, string> | undefined) || null;
  return {
    id: user.id as string,
    name: (user.name as string) ?? '',
    email: (user.email as string) ?? '',
    verified: !!(user.verified as boolean),
    admin: !!(user.admin as boolean),
    congregation: (user.congregation as string) ?? '',
    congregationName: congData?.name ?? '',
    congregationSlug: congData?.slug ?? ''
  };
}

async function fetchAvailableCongregations(client: ReturnType<typeof import('$lib/server/api').createApi>) {
  const available = await client
    .collection('congregationMeta')
    .getFullList({
      filter: client.filter('owner = null'),
      sort: 'name'
    })
    .catch(() => []);
  return available.map((c) => ({ id: c.id as string, name: c.name as string }));
}

async function resolveAdminToggle(
  client: ReturnType<typeof import('$lib/server/api').createApi>,
  userId: string,
  admin: boolean
): Promise<boolean | ReturnType<typeof fail>> {
  if (userId === client.authStore.record?.id && !admin) {
    return fail(400, { error: 'Cannot demote yourself' });
  }
  if (!admin) {
    const adminCount = await withRetry(() =>
      client.collection('users').getList(1, 1, { filter: client.filter('admin = {:admin}', { admin: true }) })
    );
    if (adminCount.totalItems <= 1) {
      return fail(400, { error: 'Cannot demote the last admin' });
    }
  }
  return admin;
}

/* endregion helpers */

export const load: PageServerLoad = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw redirect(303, '/');
  }

  const userId = params.id;
  let user: Record<string, unknown>;
  try {
    user = await withRetry(() => client.collection('users').getOne(userId, { expand: 'congregation' }));
  } catch {
    throw error(404, 'User not found');
  }

  return {
    targetUser: mapUserData(user),
    availableCongregations: await fetchAvailableCongregations(client),
    updateForm: await superValidate(zod4(updateSchema)),
    assignForm: await superValidate(zod4(assignSchema))
  };
};

export const actions = {
  update: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const body: Record<string, unknown> = { name: form.data.name, email: form.data.email };
    if (form.data.verified !== undefined) {
      body.verified = form.data.verified;
    }
    if (form.data.admin !== undefined) {
      const adminResult = await resolveAdminToggle(client, params.id, form.data.admin);
      if (typeof adminResult !== 'boolean') {
        return adminResult;
      }
      body.admin = adminResult;
    }

    try {
      await withRetry(() => client.collection('users').update(params.id, body));
      return { form, success: 'User updated' };
    } catch {
      return fail(400, { form, error: 'Update failed' });
    }
  },

  unlink: async ({ locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    try {
      await withRetry(() => client.collection('users').update(params.id, { congregation: '' }));
      return { success: 'Congregation unlinked' };
    } catch {
      return fail(400, { error: 'Failed to unlink congregation' });
    }
  },

  deleteAccount: async ({ locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    try {
      await withRetry(() => client.collection('users').delete(params.id));
      throw redirect(303, '/admin/users');
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 303) {
        throw err;
      }
      return fail(400, { error: 'Failed to delete account' });
    }
  },

  assign: async ({ locals, params, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod4(assignSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await withRetry(() => client.collection('users').update(params.id, { congregation: form.data.congregationId }));
      return { form, success: 'Congregation assigned' };
    } catch {
      return fail(400, { form, error: 'Failed to assign congregation' });
    }
  },

  resetPassword: async ({ fetch, locals, params }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) {
      throw error(401, 'Unauthorized');
    }

    try {
      const user = await withRetry(() => client.collection('users').getOne(params.id));
      await withRetry(() => client.collection('users').requestPasswordReset(user.email as string, { fetch }));
      return { success: 'Password reset email sent' };
    } catch {
      return fail(400, { error: 'Failed to send password reset' });
    }
  }
} satisfies Actions;
