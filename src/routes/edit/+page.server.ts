/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { redirect, fail } from '@sveltejs/kit';
import { omit } from 'radashi';

import type { LocationRecord, LocationMeta } from '$lib/location';
import type {
	CongregationMetaRecord,
	AccessibilityRecord,
	FitRecord,
	RegistrationRecord,
	HealthRecord,
	SecurityRecord,
	ServicesRecord
} from '$lib/types';

import { PROSOPO_SECRET, PROSOPO_ENDPOINT } from '$env/static/private';
import { cleanResponse } from '$lib/api';
import { defaultSchema, deleteSchema, transferSchema } from '$lib/schemas/record';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

/* region types */
type MetaRecord = {
	accessibility: AccessibilityRecord & { id: string };
	fit: FitRecord & { id: string };
	location: LocationRecord & { id: string };
	registration: RegistrationRecord & { id: string };
	health: HealthRecord & { id: string };
	security: SecurityRecord & { id: string };
	services: ServicesRecord & { id: string };
};

type RecordWithId = CongregationMetaRecord & { id: string };
/* endregion types */

export const load = async ({ locals, fetch, cookies, url }) => {
	const { api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (client?.id) {
			const id = client?.admin ? url.searchParams.get('id') : client.congregation;

			const congregation = cleanResponse(
				await api.collection('congregationMeta').getFirstListItem(`id="${id}"`, { fetch })
			) as RecordWithId;

			const location = congregation.location as LocationMeta;

			return {
				form: {
					default: await validate(
						defaultSchema,
						cleanResponse({
							...congregation,
							location: {
								country: location.country?.id,
								state: location.state?.id,
								city: location.city?.id
							}
						})
					),
					delete: await validate(deleteSchema, { id }),
					transfer: await validate(transferSchema, { id })
				},
				congregation
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
	submit: async (event) => {
		const { fetch, locals, cookies } = event;
		const { api, validate } = locals;
		const client = loadUser(cookies);

		const form = await validate(defaultSchema, event);
		const data = form.data as RecordWithId & MetaRecord;

		try {
			if (!client?.id) {
				const error = new Error('Forbidden') as ClientResponseError;
				error.status = 403;
				throw error;
			}

			if (!form.valid) {
				throw new Error('Invalid form data');
			}

			const captcha = await (
				await fetch(PROSOPO_ENDPOINT, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						token: form.data.captcha,
						secret: PROSOPO_SECRET
					})
				})
			).json();

			if (!captcha.verified) {
				return fail(400, {
					form: { ...form, error: 'Captcha verification failed' }
				});
			}

			const { accessibility, fit, location, registration, health, services, security } = data;

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

			return {
				form
			};
		} catch (error) {
			const err = error as ClientResponseError;

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
	delete: async (event) => {
		const { fetch, locals, cookies } = event;
		const { api, validate } = locals;
		const client = loadUser(cookies);

		const form = await validate(defaultSchema, event);
		const data = form.data as RecordWithId & MetaRecord;

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
			const { accessibility, fit, registration, health, services, security } = record as MetaRecord;

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
					error: err.message,
					errors: {
						...form.errors
					}
				}
			});
		}
	}
};
