/* region imports */

import { fail, redirect } from '@sveltejs/kit';
import type { ClientResponseError } from 'pocketbase';
import { isEmpty, isFunction, omit } from 'radashi';
import { m } from '$lib/paraglide/messages';
import type {
  AccessibilityRecord,
  CongregationMetaRecord,
  FitRecord,
  HealthRecord,
  RegistrationRecord,
  SecurityRecord,
  ServicesRecord
} from '$lib/pocketbase.d';
import { defaultSchema, deleteSchema } from '$lib/schemas/record';
import { cleanResponse, throwAsHttpError, withRetry } from '$lib/server/api';
import { clearCongregationCache } from '$lib/server/cache';
import { log } from '$lib/server/logger';
import { adminMail, transactionalMail } from '$lib/server/mail';
import type { LocationMeta, LocationRecord } from '$lib/types.d';

/* endregion imports */

/* region types */
type MetaRecord = RecordWithId & {
  accessibility: AccessibilityRecord & { id: string };
  fit: FitRecord & { id: string };
  health: HealthRecord & { id: string };
  location: LocationRecord & { id: string };
  registration: RegistrationRecord & { id: string };
  security: SecurityRecord & { id: string };
  services: ServicesRecord & { id: string };
};
type RecordWithId = CongregationMetaRecord & { id: string };
/* endregion types */

/* region helpers */

/** PocketBase record IDs are 15-character `[a-z0-9]` strings. */
const PB_ID_RE = /^[a-z0-9]{15}$/;

function upsertChildRecord(
  batch: {
    collection: (name: string) => {
      update: (id: string, data: Record<string, unknown>) => void;
      create: (data: Record<string, unknown>) => void;
    };
  },
  collection: string,
  data: { id?: string },
  congregationId: string | undefined
) {
  if (data.id && PB_ID_RE.test(data.id)) {
    batch.collection(collection).update(data.id, omit(data, ['id']));
  } else if (!isEmpty(data)) {
    batch.collection(collection).create({ ...data, congregation: congregationId });
  }
}

async function sendDeleteNotifications(client: Record<string, unknown> | null | undefined) {
  if (!client) {
    return;
  }
  if (!client.admin) {
    await transactionalMail({
      email: client.email as string,
      message: m.transactional_deleted({ locale: (client.lang as string) || 'en' }),
      name: client.name as string,
      subject: m.transactional_subject({ locale: (client.lang as string) || 'en' })
    });
  }
}

async function sendEditNotifications(
  client: Record<string, unknown> | null | undefined,
  data: { id?: string; name?: string; owner?: string; visible?: boolean },
  api: import('$lib/pocketbase.d').TypedPocketBase,
  priorToChange: { visible?: boolean }
) {
  if (!client) {
    return;
  }
  if (!client.admin) {
    const c = client as { email: string; name: string; lang?: string };
    await adminMail(
      {
        email: c.email,
        message: `
          ${data.name} has been edited. Changes require administrator approval:\n
          https://opencommunities.info/edit?id=${data.id}
        `,
        name: c.name,
        subject: `${data.name} edited`
      },
      api
    );

    await transactionalMail({
      email: c.email,
      message: `${m.transactional_updated({ locale: c.lang || 'en' })} ${m.transactional_confirmation({
        locale: c.lang || 'en'
      })}`,
      name: c.name,
      subject: m.transactional_subject({ locale: c.lang || 'en' })
    });
  } else if (client.admin && data.owner && data.visible && !priorToChange.visible) {
    const owner = await api.collection('users').getOne(data.owner, { fetch: undefined });
    await transactionalMail({
      email: owner.email,
      message: m.transactional_updateApproved({
        locale: owner.lang || 'en'
      }),
      name: owner.name,
      subject: m.transactional_subject({ locale: owner.lang || 'en' })
    });
  }
}

/* endregion helpers */

export const load = async ({ fetch, locals, url }) => {
  const { api, captureException, validate } = locals;
  const client = api?.authStore?.record;

  if (!client?.id) {
    redirect(302, '/login');
  }

  try {
    const id = client?.admin ? url.searchParams.get('id') : client.congregation;

    const congregation = cleanResponse(
      await api.collection('congregationMeta').getFirstListItem(api.filter('id={:id}', { id }), { fetch })
    ) as unknown as RecordWithId;

    const location = congregation.location as LocationMeta;

    return {
      congregation,
      form: {
        default: await validate(
          cleanResponse({
            ...congregation,
            location: {
              city: location.city?.id,
              country: location.country?.id,
              state: location.state?.id
            }
          }),
          defaultSchema
        ),
        delete: await validate({ id }, deleteSchema)
      }
    };
  } catch (error) {
    // Don't capture expected 404s (deleted congregation / stale client.congregation)
    // as PostHog errors — they're handled and surfaced to the user below.
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as Record<string, number>).status === 404
    ) {
      log.warn('Congregation not found for edit', {
        id: client?.admin ? url.searchParams.get('id') : client?.congregation
      });
      throwAsHttpError(error as { message?: string; status?: number });
    }

    if (isFunction(captureException)) {
      await captureException(error, client?.id);
    }
    throwAsHttpError(error as { message?: string; status?: number });
  }
};

export const actions = {
  delete: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, validate } = locals;
    const client = api?.authStore?.record;

    const form = await validate(event, deleteSchema);
    const data = form.data as MetaRecord & RecordWithId;

    try {
      if (isFunction(capture)) {
        await capture(client?.id, 'deleteCongregation');
      }
    } catch (captureError) {
      log.error('PostHog capture failed:', captureError);
    }

    try {
      if (!client?.admin && client?.congregation !== data.id) {
        return fail(403, { error: 'Forbidden', form });
      }

      if (!form.valid) {
        throw new Error('Invalid form data');
      }

      const record = (await withRetry(() =>
        api.collection('congregationMeta').getOne(data.id, { fetch })
      )) as MetaRecord;
      const { accessibility, fit, health, owner, registration, security, services } = record;

      const batch = api.createBatch();

      if (owner) {
        batch.collection('users').update(owner, { congregation: '' });
      }
      const childCollections = [
        { id: accessibility?.id, name: 'accessibility' },
        { id: fit?.id, name: 'fit' },
        { id: registration?.id, name: 'registration' },
        { id: health?.id, name: 'health' },
        { id: security?.id, name: 'security' },
        { id: services?.id, name: 'services' }
      ] as const;
      for (const child of childCollections) {
        if (child.id) {
          batch.collection(child.name).delete(child.id);
        }
      }
      batch.collection('congregations').delete(data.id);
      await withRetry(() => batch.send({ fetch }));

      clearCongregationCache();
      await sendDeleteNotifications(client);
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id, { url: event.url.toString() });
      }

      return fail(err.status ?? 400, { form });
    }

    // Must be outside try-catch so redirect()'s throw propagates
    redirect(302, '/');
  },
  submit: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, validate } = locals;
    const client = api?.authStore?.record;

    const form = await validate(event, defaultSchema);
    const { data } = form;

    try {
      if (isFunction(capture)) {
        await capture(client?.id, 'editCongregation');
      }
    } catch (captureError) {
      log.error('PostHog capture failed:', captureError);
    }

    try {
      if (!client?.admin && client?.congregation !== data.id) {
        return fail(403, { error: 'Forbidden', form });
      }

      if (!form.valid) {
        throw new Error('Invalid form data');
      }

      const priorToChange = await withRetry(() => api.collection('congregationMeta').getOne(data.id ?? '', { fetch }));
      const { accessibility, fit, health, location, registration, security, services } = data;
      const batch = api.createBatch();

      if (data.id) {
        batch.collection('congregations').update(data.id, {
          ...omit(data, [
            'id',
            'accessibility',
            'fit',
            'location',
            'registration',
            'owner',
            'health',
            'security',
            'services'
          ]),
          visible: client?.admin ? data.visible : false,
          ...location
        });
      }
      upsertChildRecord(batch, 'accessibility', accessibility, data.id);
      upsertChildRecord(batch, 'fit', fit, data.id);
      upsertChildRecord(batch, 'registration', registration, data.id);
      upsertChildRecord(batch, 'health', health, data.id);
      upsertChildRecord(batch, 'security', security, data.id);
      upsertChildRecord(batch, 'services', services, data.id);
      await withRetry(() => batch.send({ fetch }));

      clearCongregationCache();
      // biome-ignore lint/suspicious/noExplicitAny: AuthRecord not assignable to Record<string, unknown>
      await sendEditNotifications(client as any, data, api, priorToChange);

      return { form };
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id, { url: event.url.toString() });
      }

      return fail(err.status ?? 400, { form });
    }
  }
};
