import { error, json } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages';
import { withRetry } from '$lib/server/api';
import { transactionalMail } from '$lib/server/mail';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');

  const cong = await withRetry(() => client.collection('congregations').getOne(params.id, { expand: 'owner' }));

  // Send rejection email before deleting
  const owner = (cong as Record<string, unknown>).expand as
    | Record<string, { email?: string; name?: string }>
    | undefined;
  if (owner?.owner?.email) {
    await transactionalMail({
      email: owner.owner.email,
      name: owner.owner.name ?? '',
      subject: m.transactional_rejectedSubject(),
      message: m.transactional_rejectedBody({ name: cong.name as string })
    });
  }

  await client.collection('congregations').delete(params.id);
  return json({ success: true });
};
