/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { redirect, fail } from '@sveltejs/kit';
import { omit } from 'radashi';

import type {
	CongregationMetaRecord,
	PagesRecord,
	AccommodationsRecord,
	FitRecord,
	RegistrationRecord,
	SafetyRecord,
	ServicesRecord
} from '$lib/types';

import { defaultSchema } from '$lib/schemas';
import { loadUser, handleError } from '$lib/server/api';
/* endregion imports */

export const load = async ({ locals, fetch, cookies }) => {
	const { api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (client?.id) {
			const content = (await api
				.collection('pages')
				.getFirstListItem(`slug="add-${client.lang}"`, { fetch })) as PagesRecord;

			return { form: { default: await validate(defaultSchema) }, content };
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

type MetaRecord = {
	accommodations: AccommodationsRecord;
	fit: FitRecord;
	registration: RegistrationRecord;
	safety: SafetyRecord;
	services: ServicesRecord;
};

export const actions = {
	add: async (event) => {
		const { fetch, locals } = event;
		const { api, validate } = locals;

		const form = await validate(defaultSchema);

		try {
			if (!form.valid) {
				return {
					form
				};
			}

			const record = await api
				.collection('congregations')
				.create(
					omit(form.data as CongregationMetaRecord, [
						'accommodations',
						'fit',
						'registration',
						'safety',
						'services'
					]),
					{ fetch }
				);

			const { accommodations, fit, registration, safety, services } = form.data as MetaRecord;

			await Promise.all([
				api
					.collection('accommodations')
					.create({ ...accommodations, congregation: record.id }, { fetch }),
				api.collection('fit').create({ ...fit, congregation: record.id }, { fetch }),
				api
					.collection('registration')
					.create({ ...registration, congregation: record.id }, { fetch }),
				api.collection('safety').create({ ...safety, congregation: record.id }, { fetch }),
				api.collection('services').create({ ...services, congregation: record.id }, { fetch })
			]);

			return {
				form
			};
		} catch (error) {
			const err = error as ClientResponseError;

			return fail(err.status, {
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
