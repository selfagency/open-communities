/* region imports */

import { fail } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { isFunction } from 'radashi';
import { m } from '$lib/paraglide/messages';
import type { CongregationMetaRecord } from '$lib/pocketbase.d';
import { contactSchema } from '$lib/schemas/contact';
import { withRetry } from '$lib/server/api';
import { adminMail } from '$lib/server/mail';
import { validateCaptcha } from '$lib/server/utils';
import type { LocationMeta } from '$lib/types.d';
import { truncateText } from '$lib/utils';

/* endregion imports */

// Short TTL cache for congregation data
const congregationCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CONGREGATION_CACHE_TTL_MS = 30_000; // 30 seconds

async function getCachedCongregations<T>(
  api: {
    collection: (name: string) => {
      getFullList: (opts?: object) => Promise<T[]>;
    };
  },
  opts: object
): Promise<T[]> {
  const cacheKey = JSON.stringify(opts);
  const cached = congregationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CONGREGATION_CACHE_TTL_MS) {
    return cached.data as T[];
  }
  const data = await api.collection('congregationMeta').getFullList(opts);
  congregationCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export const load = async (event) => {
  const { fetch, locals } = event;
  const { api, captureException, log, validate } = locals;
  const client = api?.authStore?.record;

  try {
    const congregations = (await withRetry(() => getCachedCongregations(api, { fetch }))).map((c) => {
      const rec = c as CongregationMetaRecord & { id: string };
      const location = rec.location as LocationMeta;
      const label = truncateText(
        `${rec.name}${location?.city?.name ? `, ${location.city.name}` : ''}${location?.state?.name ? `, ${location.state.name}` : ''}${location?.country?.name ? `, ${location.country.name}` : ''}`,
        38
      );
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
        return fail(400, {
          form
        });
      }

      const captchaValid = await validateCaptcha(form);
      if (!captchaValid) {
        return fail(400, { form });
      }

      try {
        await adminMail(
          {
            email: form.data.email,
            message: `
						${m[`contactOptions_${form.data.reason}`]()}

						${form.data.message}

						https://opencommunities.info/edit?id=${form.data.record}${['claim', 'transfer'].includes(form.data.reason) ? `&transfer=${form.data.email}` : ''}
						`,
            name: form.data.name,
            subject: `Contact form: ${form.data.reason}`
          },
          api
        );
      } catch (error) {
        if (isFunction(captureException)) {
          await captureException(error, client?.id);
        }
        return fail(400, {
          error,
          form
        });
      }

      return {
        form
      };
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
