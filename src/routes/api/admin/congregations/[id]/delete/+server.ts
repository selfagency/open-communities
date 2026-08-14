import { error, json } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages';
import { withRetry } from '$lib/server/api';
import { transactionalMail } from '$lib/server/mail';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const client = locals.api;
  if (!client?.authStore?.record?.admin) {
    throw error(401, 'Unauthorized');
  }

  const cong = await withRetry(() => client.collection('congregations').getOne(params.id, { expand: 'owner' }));

  // Send rejection email before deleting
  let emailSent = false;
  const owner = (cong as unknown as { expand?: Record<string, unknown> }).expand as
    | Record<string, { email?: string; name?: string }>
    | undefined;
  if (owner?.owner?.email) {
    const result = await transactionalMail({
      email: owner.owner.email,
      message: m.transactional_rejectedBody({ name: cong.name as string }),
      name: owner.owner.name ?? '',
      subject: m.transactional_rejectedSubject()
    });
    emailSent = result.ok;
  }

  // Child records reference the congregation with cascadeDelete: false, so
  // delete them first or PocketBase refuses to delete the parent.
  const childCollections = ['accessibility', 'fit', 'health', 'registration', 'security', 'services'];
  await Promise.all(
    childCollections.map(async (child) => {
      const children = await withRetry(() =>
        client.collection(child).getFullList({ filter: client.filter('congregation = {:id}', { id: params.id }) })
      ).catch(() => [] as never[]);
      await Promise.all(
        (children as Array<{ id: string }>).map((r) =>
          withRetry(() => client.collection(child).delete(r.id)).catch(() => null)
        )
      );
    })
  );

  await withRetry(() => client.collection('congregations').delete(params.id));
  return json({ emailSent, success: true });
};
