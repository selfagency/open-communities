import { error, json } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages';
import { withRetry } from '$lib/server/api';
import { transactionalMail } from '$lib/server/mail';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const cong = await withRetry(() => client.collection('congregations').getOne(params.id, { expand: 'owner' }));
  await withRetry(() => client.collection('congregations').update(params.id, { visible: !cong.visible }));

  // Send approval email if making visible
  let emailSent = false;
  if (!cong.visible) {
    const owner = (cong as unknown as Record<string, unknown>).expand as
      | Record<string, { email?: string; name?: string }>
      | undefined;
    if (owner?.owner?.email) {
      const result = await transactionalMail({
        email: owner.owner.email,
        name: owner.owner.name ?? '',
        subject: m.transactional_approvedSubject(),
        message: m.transactional_approvedBody({ name: cong.name as string })
      });
      emailSent = result.ok;
    }
  }

  return json({ success: true, emailSent });
};
