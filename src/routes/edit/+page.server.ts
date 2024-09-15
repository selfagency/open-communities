/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { redirect, fail } from '@sveltejs/kit';
import { omit } from 'radashi';

import type { LocationRecord } from '$lib/location';
import type {
	CongregationMetaRecord,
	AccommodationsRecord,
	FitRecord,
	RegistrationRecord,
	SafetyRecord,
	ServicesRecord
} from '$lib/types';

import { cleanResponse } from '$lib/api';
import { defaultSchema, deleteSchema, transferSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

/* region types */
type MetaRecord = {
	accommodations: AccommodationsRecord & { id: string };
	fit: FitRecord & { id: string };
	location: LocationRecord & { id: string };
	registration: RegistrationRecord & { id: string };
	safety: SafetyRecord & { id: string };
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

			const congregation = await api
				.collection('congregationMeta')
				.getFirstListItem(`id="${id}"`, { fetch });

			return {
				form: {
					default: await validate(defaultSchema, cleanResponse(congregation)),
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

			const { accommodations, fit, location, registration, safety, services } = data;

			await Promise.all([
				api.collection('congregations').update(
					data.id,
					{
						...omit(data, [
							'id',
							'accommodations',
							'fit',
							'location',
							'registration',
							'safety',
							'services'
						]),
						visible: client?.admin ? data.visible : false,
						...location
					},
					{ fetch }
				),
				api
					.collection('accommodations')
					.update(accommodations.id, omit(accommodations, ['id']), { fetch }),
				api.collection('fit').update(fit.id, omit(fit, ['id']), { fetch }),
				api
					.collection('registration')
					.update(registration.id, omit(registration, ['id']), { fetch }),
				api.collection('safety').update(safety.id, omit(safety, ['id']), { fetch }),
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
					errors: {
						...form.errors,
						error: err.message
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
			const { accommodations, fit, registration, safety, services } = record as MetaRecord;

			await Promise.all([
				api.collection('accommodations').delete(accommodations.id, { fetch }),
				api.collection('fit').delete(fit.id, { fetch }),
				api.collection('registration').delete(registration.id, { fetch }),
				api.collection('safety').delete(safety.id, { fetch }),
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
					errors: {
						...form.errors,
						error: err.message
					}
				}
			});
		}
	}
};
