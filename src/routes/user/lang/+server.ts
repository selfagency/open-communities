import { json } from '@sveltejs/kit';

import type { UsersRecord } from '$lib/pocketbase.d';

import { log } from '$lib/server/logger';

export async function POST({ cookies, locals, request }) {
  const { api, captureException } = locals;
  const client = api.authStore.record;

  const { lang, user } = await request.json();

  let result: null | UsersRecord = null;

  try {
    cookies.set('lang', lang, locals.cookieOpts);

    if (user) {
      // api.authStore.loadFromCookie(cookies.get('auth') as string);
      result = await api.collection('users').update(user, {
        lang
      });
    }

    return json({ result, status: 201 });
  } catch (error) {
    await captureException(error, client?.id);
    log.error('Error updating user:', error);
    return json({ error: 'Failed to update user language' }, { status: 500 });
  }
}
