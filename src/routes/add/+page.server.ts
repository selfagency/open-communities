/* region imports */

import { fail, redirect } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { isEmpty, isFunction, omit } from 'radashi';
import { setError } from 'sveltekit-superforms/server';
import { m } from '$lib/paraglide/messages';
import type { CongregationsResponse, PagesRecord } from '$lib/pocketbase.d';
import { defaultSchema } from '$lib/schemas/record';
import { withRetry } from '$lib/server/api';
import { clearCongregationCache } from '$lib/server/cache';
import { log } from '$lib/server/logger';
import { adminMail, transactionalMail } from '$lib/server/mail';
import { validateCaptcha } from '$lib/server/utils';
/* endregion imports */

export const load = async (event) => {
  const { fetch, locals } = event;
  const { api, captureException, validate } = locals;
  const client = api?.authStore?.record;

  // Must be outside try-catch so redirect()'s throw propagates
  if (!client?.id) {
    redirect(302, '/login?signUp=true');
  }

  try {
    const content = (await withRetry(() =>
      api.collection('pages').getFirstListItem(api.filter('slug={:slug}', { slug: `add-${client?.lang || 'en'}` }), {
        fetch
      })
    )) as PagesRecord;

    return { content, form: { default: await validate(event, defaultSchema) } };
  } catch (error) {
    if (isFunction(captureException)) {
      await captureException(error, client?.id);
    }
    // Graceful degradation: if PB is down after retries, show form without content
    log.warn('PocketBase unavailable for add page', error);
    return { content: undefined, form: { default: await validate(event, defaultSchema) } };
  }
};

/**
 * Create child records (accessibility, fit, health, registration, security, services)
 * in a single batch, linking each to the congregation.
 */
function createChildRecords(
  batch: { collection: (name: string) => { create: (data: Record<string, unknown>) => void } },
  formData: Record<string, unknown>,
  congregationId: string
) {
  const { accessibility, fit, health, registration, security, services } = formData;

  if (!isEmpty(accessibility)) {
    batch.collection('accessibility').create({ ...(accessibility as object), congregation: congregationId });
  }
  if (!isEmpty(fit)) {
    batch.collection('fit').create({ ...(fit as object), congregation: congregationId });
  }
  if (!isEmpty(registration)) {
    batch.collection('registration').create({ ...(registration as object), congregation: congregationId });
  }
  if (!isEmpty(health)) {
    batch.collection('health').create({ ...(health as object), congregation: congregationId });
  }
  if (!isEmpty(security)) {
    batch.collection('security').create({ ...(security as object), congregation: congregationId });
  }
  if (!isEmpty(services)) {
    batch.collection('services').create({ ...(services as object), congregation: congregationId });
  }
}

/**
 * Send transactional confirmation to the submitter and notification to admins.
 * Non-admin users get a confirmation email; admins skip the transactional step.
 */
async function sendSubmissionNotifications(
  client: Record<string, unknown> | null | undefined,
  record: { id: string; name: string },
  api: import('$lib/pocketbase.d').TypedPocketBase
): Promise<void> {
  if (!client) {
    return;
  }
  if (client && !client.admin) {
    try {
      await api.collection('users').update(client.id as string, { congregation: record.id });
    } catch {
      log.error('Failed to link congregation to user', client.id);
    }

    try {
      await transactionalMail({
        email: client.email as string,
        message: `${m.transactional_submitted({ locale: (client.lang as string) || 'en' })} ${m.transactional_confirmation({ locale: (client.lang as string) || 'en' })}`,
        name: client.name as string,
        subject: `${m.transactional_subject({ locale: (client.lang as string) || 'en' })}`
      });
    } catch {
      log.error('Failed to send confirmation email', client.id);
    }
  }

  await adminMail(
    {
      email: client.email as string,
      message: `A new congregation, ${record.name}, has been submitted and requires approval:\nhttps://opencommunities.info/edit?id=${record.id}`,
      name: (client.name as string) || '',
      subject: 'New congregation submitted'
    },
    api
  );
}

/**
 * Handle errors from the submit action: capture to PostHog, log, and return
 * a user-facing fail response with a specific error on duplicate name.
 */
function handleSubmitError(
  error: unknown,
  form: { data: Record<string, unknown> },
  captureException:
    | ((error: unknown, user?: string, other?: Record<string, number | string>) => Promise<void>)
    | undefined,
  clientId: string | undefined,
  url?: string
): ReturnType<typeof fail> {
  if (isFunction(captureException)) {
    captureException(error, clientId, url ? { url } : undefined);
  }
  log.error('add:submit:error', error);

  const err = error as ClientResponseError;

  // PB returns different messages for duplicate name+city violations depending
  // on whether the unique index catches it ("Failed to create record.") or the
  // field validation layer catches it ("An error occurred while validating...").
  if (
    err.message === 'Failed to create record.' ||
    err.message === 'An error occurred while validating the submitted data.'
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: superforms setError expects SuperValidated
    setError(form as any, 'name', m.exists());
  }

  return fail(err.status ?? 400, { form });
}

export const actions = {
  submit: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, validate } = locals;
    const client = api?.authStore?.record;

    const form = await validate(event, defaultSchema);
    const formData = form.data;

    if (isFunction(capture)) {
      await capture(client?.id, 'addCongregation');
    }

    try {
      if (!client?.id) {
        throw new Error('Forbidden');
      }

      if (!form.valid) {
        throw new Error('Invalid form data');
      }

      const captchaValid = await validateCaptcha(form);
      if (!captchaValid) {
        return fail(400, { form });
      }

      const record = (await withRetry(() =>
        api.collection('congregations').create(
          {
            ...omit(formData, ['accessibility', 'fit', 'health', 'location', 'registration', 'security', 'services']),
            ...(formData.location as object),
            visible: client?.admin ? formData.visible : false
          },
          { fetch }
        )
      )) as CongregationsResponse;

      const batch = api.createBatch();
      await createChildRecords(batch, formData, record.id);
      await withRetry(() => batch.send({ fetch }));

      await sendSubmissionNotifications(client, record, api);

      clearCongregationCache();

      return { form };
    } catch (error) {
      return handleSubmitError(error, form, captureException, client?.id, event.url.toString());
    }
  }
};
