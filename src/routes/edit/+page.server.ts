/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail, redirect } from '@sveltejs/kit';
import { isEmpty, omit } from 'radashi';

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
type MetaRecord = {
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
	const { api, validate } = locals;
	const client = api.authStore.record;

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
						defaultSchema,
						cleanResponse({
							...congregation,
							location: {
								city: location.city?.id,
								country: location.country?.id,
								state: location.state?.id
							}
						})
					),
					delete: await validate(deleteSchema, { id }),
					transfer: await validate(transferSchema, { id })
				}
			};
		} else {
			throw new Error('403');
		}
	} catch (error) {
		if ((error as Error).message === '403') {
			redirect(302, '/login');
		} else {
			return handleError(error);
		}
	}
};

export const actions = {
	delete: async (event) => {
		const { fetch, locals } = event;
		const { api, validate } = locals;
		const client = api.authStore.record;

		const form = await validate(deleteSchema, event);
		const data = form.data as MetaRecord & RecordWithId;

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
			const { accessibility, fit, health, registration, security, services } = record as MetaRecord;

			const batch = api.createBatch();

			batch.collection('accessibility').delete(accessibility.id);
			batch.collection('fit').delete(fit.id);
			batch.collection('registration').delete(registration.id);
			batch.collection('health').delete(health.id);
			batch.collection('security').delete(security.id);
			batch.collection('services').delete(services.id);
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

			return {
				form
			};
		} catch (error) {
			const err = error as ClientResponseError;

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
		const { api, validate } = locals;
		const client = api.authStore.record;

		const form = await validate(defaultSchema, event);
		const data = form.data as MetaRecord & RecordWithId;

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
			batch.collection('accessibility').update(accessibility.id, omit(accessibility, ['id']));
			batch.collection('fit').update(fit.id, omit(fit, ['id']));
			batch.collection('registration').update(registration.id, omit(registration, ['id']));
			batch.collection('health').update(health.id, omit(health, ['id']));
			batch.collection('security').update(security.id, omit(security, ['id']));
			batch.collection('services').update(services.id, omit(services, ['id']));
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
					message: `${m.transactional_updated({ locale: client.lang || 'en' })} ${m[
						'transactional_confirmation'
					]({
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
		const { api, validate } = locals;
		const client = api.authStore.record;

		const form = await validate(transferSchema, event);
		const data = form.data;

		try {
			if (!form.valid) {
				throw new Error('Invalid form data');
			}

			if (!client?.admin) {
				const error = new Error('Forbidden') as ClientResponseError;
				error.status = 403;
				throw error;
			}

			const batch = api.createBatch();

			const user = await api
				.collection('users')
				.getFirstListItem(`email="${data.email}"`, { fetch });

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

			return fail(err.status ?? 400, {
				form: {
					...form,
					error: err.message
				}
			});
		}
	}
};
