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

import { CAPTCHA_SITE_SECRET } from '$env/static/private';
import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
import { cleanResponse } from '$lib/api';
import { defaultSchema, deleteSchema, transferSchema } from '$lib/schemas/record';
import { handleError } from '$lib/server/api';
import { sendMail } from '$lib/server/mail';
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

		const form = await validate(defaultSchema, event);
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

			await Promise.all([
				api.collection('accessibility').delete(accessibility.id, { fetch }),
				api.collection('fit').delete(fit.id, { fetch }),
				api.collection('registration').delete(registration.id, { fetch }),
				api.collection('health').delete(health.id, { fetch }),
				api.collection('security').delete(security.id, { fetch }),
				api.collection('services').delete(services.id, { fetch })
			]);

			await api.collection('congregations').delete(data.id, { fetch });

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
		const data = form.data as MetaRecord & RecordWithId & { captcha: string };

		try {
			if (!client?.id) {
				const error = new Error('Forbidden') as ClientResponseError;
				error.status = 403;
				throw error;
			}

			if (!form.valid) {
				throw new Error('Invalid form data');
			}

			const { accessibility, fit, health, location, registration, security, services } = data;

			await Promise.all([
				api.collection('congregations').update(
					data.id,
					{
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
					},
					{ fetch }
				),
				api
					.collection('accessibility')
					.update(accessibility.id, omit(accessibility, ['id']), { fetch }),
				api.collection('fit').update(fit.id, omit(fit, ['id']), { fetch }),
				api
					.collection('registration')
					.update(registration.id, omit(registration, ['id']), { fetch }),
				api.collection('health').update(health.id, omit(health, ['id']), { fetch }),
				api.collection('security').update(security.id, omit(security, ['id']), { fetch }),
				api.collection('services').update(services.id, omit(services, ['id']), { fetch })
			]);

			if (!client?.admin) {
				await sendMail(
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

			const user = await api
				.collection('users')
				.getFirstListItem(`email="${data.email}"`, { fetch });

			if (!isEmpty(data.owner)) {
				await api.collection('users').update(data.owner, { congregation: '' }, { fetch });
			}

			await api.collection('users').update(user?.id, { congregation: data.id }, { fetch });

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
