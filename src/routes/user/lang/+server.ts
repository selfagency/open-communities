import { json } from '@sveltejs/kit';
import { isFunction } from 'radashi';

import type { UsersRecord } from '$lib/pocketbase.d';

import { env } from '$env/dynamic/public';
import { log } from '$lib/server/logger';

export async function POST({ cookies, locals, request }) {
  const { api, captureException } = locals;
  const client = api?.authStore?.record;

  // CSRF protection: reject requests with an origin that does not match the app host
  const origin = request.headers.get('origin');
  if (origin && origin !== env.PUBLIC_HOSTNAME) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const { lang, user } = await request.json();

  if (!['en', 'es', 'fr', 'he'].includes(lang)) {
    return json({ error: 'Invalid language' }, { status: 400 });
  }

  const targetUser = user ?? client?.id;
  if (!targetUser) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user && user !== client?.id) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  let result: null | UsersRecord = null;

  try {
    cookies.set('lang', lang, locals.cookieOpts);

    result = await api.collection('users').update(targetUser, {
      lang
    });

    return json({ result }, { status: 200 });
  } catch (error) {
    if (isFunction(captureException)) {
      await captureException(error, client?.id);
    }
    log.error('Error updating user:', error);
    return json({ error: 'Failed to update user language' }, { status: 500 });
  }
}
