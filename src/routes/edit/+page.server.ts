/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail, redirect } from '@sveltejs/kit';
import { isEmpty, isFunction, omit } from 'radashi';

import type {
  AccessibilityRecord,
  CongregationMetaRecord,
  FitRecord,
  HealthRecord,
  RegistrationRecord,
  SecurityRecord,
  ServicesRecord
} from '$lib/pocketbase.d';
import type { LocationMeta, LocationRecord } from '$lib/types.d';

import { cleanResponse } from '$lib/api';
import { m } from '$lib/paraglide/messages';
import { defaultSchema, deleteSchema, transferSchema } from '$lib/schemas/record';
import { handleError } from '$lib/server/api';
import { adminMail, transactionalMail } from '$lib/server/mail';
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

export const load = async ({ fetch, locals, url }) => {
  const { api, captureException, validate } = locals;
  const client = api?.authStore?.record;

  try {
    if (client?.id) {
      const id = client?.admin ? url.searchParams.get('id') : client.congregation;

      const congregation = cleanResponse(
        await api.collection('congregationMeta').getFirstListItem(`id="${id}"`, { fetch })
      ) as RecordWithId;

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
          delete: await validate({ id }, deleteSchema),
          transfer: await validate({ id }, transferSchema)
        }
      };
    } else {
      throw new Error('403');
    }
  } catch (error) {
    if ((error as Error).message === '403') {
      redirect(302, '/login');
    } else {
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }
      return handleError(error);
    }
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
      // Log capture error but don't fail the action
      console.error('PostHog capture failed:', captureError);
    }

    try {
      if (!client?.admin && client?.congregation !== data.id) {
        const error = new Error('Forbidden') as ClientResponseError;
        error.status = 403;
        throw error;
      }

      if (!form.valid) {
        throw new Error('Invalid form data');
      }

      const record = await api.collection('congregationMeta').getOne(data.id, { fetch });
      const { accessibility, fit, health, owner, registration, security, services } = record as MetaRecord;

      const batch = api.createBatch();

      if (owner) {
        batch.collection('users').update(owner, { congregation: '' });
      }
      if (accessibility?.id) {
        batch.collection('accessibility').delete(accessibility.id);
      }
      if (fit?.id) {
        batch.collection('fit').delete(fit.id);
      }
      if (registration?.id) {
        batch.collection('registration').delete(registration.id);
      }
      if (health?.id) {
        batch.collection('health').delete(health.id);
      }
      if (security?.id) {
        batch.collection('security').delete(security.id);
      }
      if (services?.id) {
        batch.collection('services').delete(services.id);
      }
      batch.collection('congregations').delete(data.id);
      await batch.send({ fetch });

      if (!client?.admin) {
        await transactionalMail({
          email: client.email,
          message: m.transactional_deleted({ locale: client.lang || 'en' }),
          name: client.name,
          subject: m.transactional_subject({ locale: client.lang || 'en' })
        });
      }

      redirect(302, '/');
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }

      return fail(err.status ?? 400, {
        form: {
          ...form,
          error: err.message
        }
      });
    }
  },
  submit: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, validate } = locals;
    const client = api?.authStore?.record;

    const form = await validate(event, defaultSchema);
    const data = form.data as MetaRecord & RecordWithId;

    try {
      if (isFunction(capture)) {
        await capture(client?.id, 'editCongregation');
      }
    } catch (captureError) {
      // Log capture error but don't fail the action
      console.error('PostHog capture failed:', captureError);
    }

    try {
      if (!client?.id) {
        const error = new Error('Forbidden') as ClientResponseError;
        error.status = 403;
        throw error;
      }

      if (!form.valid) {
        throw new Error('Invalid form data');
      }

      const priorToChange = await api.collection('congregationMeta').getOne(data.id, { fetch });
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
      if (accessibility.id) {
        batch.collection('accessibility').update(accessibility.id, omit(accessibility, ['id']));
      } else if (!isEmpty(accessibility)) {
        batch.collection('accessibility').create({ ...accessibility, congregation: data.id });
      }
      if (fit.id) {
        batch.collection('fit').update(fit.id, omit(fit, ['id']));
      } else if (!isEmpty(fit)) {
        batch.collection('fit').create({ ...fit, congregation: data.id });
      }
      if (registration.id) {
        batch.collection('registration').update(registration.id, omit(registration, ['id']));
      } else if (!isEmpty(registration)) {
        batch.collection('registration').create({ ...registration, congregation: data.id });
      }
      if (health.id) {
        batch.collection('health').update(health.id, omit(health, ['id']));
      } else if (!isEmpty(health)) {
        batch.collection('health').create({ ...health, congregation: data.id });
      }
      if (security.id) {
        batch.collection('security').update(security.id, omit(security, ['id']));
      } else if (!isEmpty(security)) {
        batch.collection('security').create({ ...security, congregation: data.id });
      }
      if (services.id) {
        batch.collection('services').update(services.id, omit(services, ['id']));
      } else if (!isEmpty(services)) {
        batch.collection('services').create({ ...services, congregation: data.id });
      }
      await batch.send({ fetch });

      if (!client?.admin) {
        await adminMail(
          {
            email: client.email,
            message: `
						${data.name} has been edited. Changes require administrator approval:\n
						https://opencommunities.info/edit?id=${data.id}
					`,
            name: client.name,
            title: `${data.name} edited`
          },
          api
        );

        await transactionalMail({
          email: client.email,
          message: `${m.transactional_updated({ locale: client.lang || 'en' })} ${m['transactional_confirmation']({
            locale: client.lang || 'en'
          })}`,
          name: client.name,
          subject: m.transactional_subject({ locale: client.lang || 'en' })
        });
      } else if (client?.admin && data.owner && form.data.visible && !priorToChange.visible) {
        const owner = await api.collection('users').getOne(data.owner, { fetch });
        await transactionalMail({
          email: owner.email,
          message: m.transactional_updateApproved({ locale: owner.lang || 'en' }),
          name: owner.name,
          subject: m.transactional_subject({ locale: owner.lang || 'en' })
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

      return fail(err.status ?? 400, {
        form: {
          ...form,
          error: err.message
        }
      });
    }
  },
  transfer: async (event) => {
    const { fetch, locals } = event;
    const { api, capture, captureException, log, validate } = locals;
    const client = api?.authStore?.record;

    const form = await validate(event, transferSchema);
    const data = form.data;

    try {
      if (isFunction(capture)) {
        await capture(client?.id, 'transferCongregation');
      }
    } catch (captureError) {
      // Log capture error but don't fail the action
      console.error('PostHog capture failed:', captureError);
    }

    try {
      if (!form.valid) {
        log.error('form', form);
        throw new Error('Invalid form data');
      }

      if (!client?.admin) {
        const error = new Error('Forbidden') as ClientResponseError;
        error.status = 403;
        throw error;
      }

      const user = await api.collection('users').getFirstListItem(`email="${data.email}"`, { fetch });

      const batch = api.createBatch();
      if (!isEmpty(data.owner)) {
        batch.collection('users').update(data.owner, { congregation: '' });
      }
      batch.collection('users').update(user?.id, { congregation: data.id });
      await batch.send({ fetch });

      await transactionalMail({
        email: user.email,
        message: m.transactional_claimedSuccess({ locale: user.lang || 'en' }),
        name: user.name,
        subject: m.transactional_subject({ locale: user.lang || 'en' })
      });

      return { form };
    } catch (error) {
      const err = error as ClientResponseError;
      if (isFunction(captureException)) {
        await captureException(error, client?.id);
      }

      return fail(err.status ?? 400, {
        form: {
          ...form,
          error: err.message
        }
      });
    }
  }
};
