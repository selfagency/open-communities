import { json } from '@sveltejs/kit';
import { isFunction } from 'radashi';
import { z } from 'zod/v4';
import { log } from '$lib/server/logger';

const VALID_LANGS = ['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk'] as const;

const langSchema = z.object({
  lang: z.enum(VALID_LANGS),
  user: z.string().optional()
});

export async function POST({ cookies, locals, request, url }) {
  const { api, captureException } = locals;
  const client = api?.authStore?.record;

  // CSRF protection: reject requests with a mismatched origin
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = langSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: `Invalid language. Must be one of: ${VALID_LANGS.join(', ')}` }, { status: 400 });
  }

  const { lang, user: targetUserId } = parsed.data;
  const isAdmin = client?.admin === true;

  // Authorization: self-update for normal users, cross-user only for admins
  if (targetUserId && targetUserId !== client?.id && !isAdmin) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUser = targetUserId ?? client?.id;

  try {
    cookies.set('lang', lang, locals.cookieOpts);

    if (targetUser) {
      await api.collection('users').update(targetUser, { lang });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    if (isFunction(captureException)) {
      await captureException(error, client?.id);
    }
    log.error('Error updating user:', error);
    return json({ error: 'Failed to update user language' }, { status: 500 });
  }
}
