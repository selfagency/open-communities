/* region imports */

import { fail } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { isFunction } from 'radashi';

import type { UsersRecord } from '$lib/pocketbase.d';

import { loginSchema, tokenSchema } from '$lib/schemas/login';
import { userSchema } from '$lib/schemas/user';
import { cleanResponse } from '$lib/server/api';
import { closePhClient } from '$lib/server/posthog';
import { validateCaptcha } from '$lib/server/utils';

import type { PageServerLoad } from './$types';
/* endregion imports */

export const load: PageServerLoad = async (event) => {
  const { locals } = event;

  return {
    login: await locals.validate(event, loginSchema),
    reset: await locals.validate(event, tokenSchema),
    signup: await locals.validate(event, userSchema),
    verify: await locals.validate(event, tokenSchema)
  };
};

export const actions = {
  acct: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, validate } = locals;
    const client = api?.authStore?.record;
    const form = await validate(event, tokenSchema);

    if (isFunction(capture)) {
      await capture(client?.id, form.data.type);
    }

    try {
      if (!form.valid) {
        return fail(400, {
          form
        });
      }

      // biome-ignore lint/style/useDefaultSwitchClause: all cases handled explicitly
      switch (form.data.type) {
        case 'requestReset':
          await api.collection('users').requestPasswordReset(form.data.email as string, { fetch });
          break;
        case 'resetPassword':
          await api
            .collection('users')
            .confirmPasswordReset(
              form.data.token as string,
              form.data.password as string,
              form.data.passwordConfirm as string,
              { fetch }
            );
          break;
        case 'verifyEmail':
          await api.collection('users').confirmVerification(form.data.token as string, { fetch });
          break;
      }

      return {
        form
      };
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }
      closePhClient();

      return fail(err.status ?? 400, {
        form: {
          ...form,
          error: err.message,
          errors: {
            ...form.errors
          }
        }
      });
    }
  },
  login: async (event) => {
    const { cookies, fetch, locals } = event;
    const { api, capture, captureException, cookieOpts, log } = locals;
    const client = api?.authStore?.record;

    const form = await locals.validate(event, loginSchema);
    let user: UsersRecord;

    try {
      if (!form.valid) {
        log.error('form invalid', { errors: form.errors });
        return fail(400, {
          form
        });
      }

      user = cleanResponse(
        (
          await api
            .collection('users')
            .authWithPassword(form.data.email as string, form.data.password as string, { fetch })
        ).record as unknown as Record<string, unknown>
      ) as unknown as UsersRecord;

      // Use the same cookieOpts from locals to ensure consistency
      cookies.set('auth', api.authStore.exportToCookie(), cookieOpts);
      cookies.set('session', crypto.randomUUID(), cookieOpts);

      if (isFunction(capture)) {
        await capture((user as UsersRecord & { id: string }).id, 'login');
      }
      closePhClient();

      return {
        form,
        user
      };
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(capture)) {
        await capture(client?.id, 'login_failure', {
          error_status: err.status,
          error_message: (err.message ?? '').slice(0, 120),
          error_url: event.url.pathname
        });
      }
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }
      closePhClient();

      return fail(err.status ?? 401, { form });
    }
  },
  // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
  logout: async (event) => {
    const { cookies, locals } = event;

    cookies.set('auth', '', locals.cookieOpts);
    cookies.set('session', '', locals.cookieOpts);

    return {};
  },
  signup: async (event) => {
    const { locals } = event;
    const { api, capture, captureException, validate } = locals;
    const form = await validate(event, userSchema);

    let user: UsersRecord;

    try {
      if (!form.valid) {
        return fail(400, {
          form
        });
      }

      const captchaValid = await validateCaptcha(form);
      if (!captchaValid) {
        return fail(400, { form });
      }

      user = (await api.collection('users').create(
        {
          email: form.data.email as string,
          emailVisibility: form.data.emailVisibility as boolean,
          lang: form.data.lang as string,
          name: form.data.name as string,
          password: form.data.password as string,
          passwordConfirm: form.data.passwordConfirm as string
        },
        { fetch }
      )) as UsersRecord;

      // S-13: capture after success using user ID, not email as PII distinctId
      if (isFunction(capture)) {
        await capture((user as UsersRecord & { id: string }).id, 'signup');
      }

      await api.collection('users').requestVerification(form.data.email as string, { fetch });

      return {
        form,
        user
      };
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error);
      }

      return fail(err.status || 400, {
        form: {
          ...form,
          error: err.message,
          errors: {
            ...form.errors
          }
        }
      });
    }
  }
};
