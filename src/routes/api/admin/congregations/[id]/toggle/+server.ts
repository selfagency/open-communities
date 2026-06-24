import { error, json } from '@sveltejs/kit';
import { withRetry } from '$lib/server/api';
import { transactionalMail } from '$lib/server/mail';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');

  const cong = await withRetry(() => client.collection('congregations').getOne(params.id, { expand: 'owner' }));
  await client.collection('congregations').update(params.id, { visible: !cong.visible });

  // Send approval email if making visible
  if (!cong.visible) {
    const owner = (cong as Record<string, unknown>).expand as
      | Record<string, { email?: string; name?: string }>
      | undefined;
    if (owner?.owner?.email) {
      await transactionalMail({
        email: owner.owner.email,
        name: owner.owner.name ?? '',
        subject: 'Your congregation has been approved',
        message: `Your congregation "${cong.name}" has been approved and is now visible on the directory.`
      });
    }
  }

  return json({ success: true });
};
