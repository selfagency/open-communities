/* region imports */

import { fail } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { isFunction } from 'radashi';
import type { SuperValidated } from 'sveltekit-superforms';
import { m } from '$lib/paraglide/messages';
import type { CongregationMetaRecord, TypedPocketBase } from '$lib/pocketbase.d';
import { contactSchema } from '$lib/schemas/contact';
import { withRetry } from '$lib/server/api';
import { getCachedCongregations } from '$lib/server/cache';
import { adminMail } from '$lib/server/mail';
import { validateCaptcha } from '$lib/server/utils';
import type { LocationMeta } from '$lib/types.d';
import { truncateText } from '$lib/utils';

/* endregion imports */

export const load = async (event) => {
  const { fetch, locals } = event;
  const { api, captureException, log, validate } = locals;
  const client = api?.authStore?.record;

  try {
    const congregations = (await withRetry(() => getCachedCongregations(api, { fetch }))).map((c) => {
      const rec = c as CongregationMetaRecord & { id: string };
      const location = rec.location as LocationMeta;
      const parts = [
        rec.name,
        location?.city?.name ? `, ${location.city.name}` : '',
        location?.state?.name ? `, ${location.state.name}` : '',
        location?.country?.name ? `, ${location.country.name}` : ''
      ];
      const label = truncateText(parts.join(''), 38);
      return {
        id: rec.id,
        label: truncateText(label, 38),
        value: label
      };
    });

    return {
      congregations,
      form: await validate(event, contactSchema)
    };
  } catch (error) {
    if (isFunction(captureException)) {
      await captureException(error, client?.id);
    }
    log.error('contact:load:error', error);

    return {
      form: await validate(event, contactSchema)
    };
  }
};

async function sendContactMail(form: SuperValidated<Record<string, unknown>>, api: TypedPocketBase) {
  const reasonKey = `contactOptions_${form.data.reason as string}` as keyof typeof m;
  const reasonFn = m[reasonKey];
  if (typeof reasonFn !== 'function') {
    return fail(400, { form, error: 'Invalid reason' });
  }

  const record = form.data.record as string | undefined;
  const reason = form.data.reason as string;
  const email = form.data.email as string;
  const transferParam = ['claim', 'transfer'].includes(reason) ? `&transfer=${encodeURIComponent(email)}` : '';
  const editUrl = record ? `https://opencommunities.info/edit?id=${record}${transferParam}` : '';

  await adminMail(
    {
      email: form.data.email as string,
      message: `
					${(reasonFn as (...args: unknown[]) => string)()}

					${form.data.message as string}

					${editUrl}
					`,
      name: form.data.name as string,
      subject: `Contact form: ${form.data.reason as string}`
    },
    api
  );

  return { form };
}

export const actions = {
  default: async (event) => {
    const { api, capture, captureException, log } = event.locals;
    const client = api?.authStore?.record;
    const form = await event.locals.validate(event, contactSchema);

    if (isFunction(capture)) {
      await capture(client?.id, 'contactForm');
    }

    try {
      if (!form.valid) {
        return fail(400, { form });
      }

      const captchaValid = await validateCaptcha(form);
      if (!captchaValid) {
        return fail(400, { form });
      }

      return await sendContactMail(form, api);
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }
      log.error('error', err);

      return fail(err.status || 400, {
        form: {
          ...form,
          error: err.message
        }
      });
    }
  }
};
