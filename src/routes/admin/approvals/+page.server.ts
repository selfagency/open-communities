import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';
import { transactionalMail } from '$lib/server/mail';

export const load: PageServerLoad = async ({ locals }) => {
  const { api } = locals;

  const [newSubmissions, pendingChanges] = await Promise.all([
    withRetry(() =>
      api.collection('congregationMeta').getList(1, 50, {
        filter: 'visible=false && owner=null',
        sort: '-created'
      })
    ),
    withRetry(() =>
      api.collection('congregationMeta').getList(1, 50, {
        filter: 'visible=false && owner!=null',
        sort: '-created'
      })
    )
  ]);

  return {
    title: 'Approvals',
    newSubmissions: newSubmissions.items,
    pendingChanges: pendingChanges.items
  };
};

export const actions: Actions = {
  approve: async ({ locals, request }) => {
    const { api } = locals;
    const form = await request.formData();
    const id = form.get('id') as string;

    await api.collection('congregations').update(id, { visible: true });

    // Notify owner if exists
    try {
      const meta = await api.collection('congregationMeta').getOne(id);
      if (meta.owner) {
        const owner = await api.collection('users').getOne(meta.owner);
        await transactionalMail({
          email: owner.email,
          name: owner.name || '',
          subject: 'Your congregation has been approved',
          message: `Your congregation "${meta.name}" has been approved and is now visible on the directory.`
        });
      }
    } catch {
      // Email failure is non-critical
    }

    return { success: true };
  },

  reject: async ({ locals, request }) => {
    const { api } = locals;
    const form = await request.formData();
    const id = form.get('id') as string;
    const reason = form.get('reason') as string;

    try {
      const meta = await api.collection('congregationMeta').getOne(id);
      if (meta.owner) {
        const owner = await api.collection('users').getOne(meta.owner);
        await transactionalMail({
          email: owner.email,
          name: owner.name || '',
          subject: 'Your congregation submission',
          message: `Your congregation "${meta.name}" was not approved.${reason ? ` Reason: ${reason}` : ''}`
        });
      }
    } catch {
      // Email failure is non-critical
    }

    // Delete congregation and child records
    await api.collection('congregations').delete(id);

    return { success: true };
  }
};
