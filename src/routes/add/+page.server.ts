/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { redirect, fail } from '@sveltejs/kit';
import { omit } from 'radashi';

import type { LocationRecord } from '$lib/location';
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

/* region types */
type MetaRecord = {
	accommodations: AccommodationsRecord;
	fit: FitRecord;
	location: LocationRecord;
	registration: RegistrationRecord;
	safety: SafetyRecord;
	services: ServicesRecord;
};
/* endregion types */

export const load = async ({ locals, fetch, cookies }) => {
	const { api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (!client?.id) {
			throw new Error('Forbidden');
		}

		const content = (await api
			.collection('pages')
			.getFirstListItem(`slug="add-${client?.lang || 'en'}"`, { fetch })) as PagesRecord;

		return { form: { default: await validate(defaultSchema) }, content };
	} catch (error) {
		if ((error as Error).message === 'Forbidden') {
			redirect(302, '/login?signUp=true');
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
		const formData = form.data as CongregationMetaRecord & MetaRecord;

		try {
			if (!client?.id) {
				throw new Error('Forbidden');
			}

			if (!form.valid) {
				throw new Error('Invalid form data');
			}

			const record = await api.collection('congregations').create(
				{
					...omit(formData, ['accommodations', 'fit', 'registration', 'safety', 'services']),
					visible: client?.admin ? formData.visible : false
				},
				{ fetch }
			);

			const { accommodations, fit, location, registration, safety, services } =
				formData as MetaRecord;

			await Promise.all([
				api
					.collection('accommodations')
					.create({ ...accommodations, congregation: record.id }, { fetch }),
				api.collection('fit').create({ ...fit, congregation: record.id }, { fetch }),
				api.collection('locations').create({ ...location, congregation: record.id }, { fetch }),
				api
					.collection('registration')
					.create({ ...registration, congregation: record.id }, { fetch }),
				api.collection('safety').create({ ...safety, congregation: record.id }, { fetch }),
				api.collection('services').create({ ...services, congregation: record.id }, { fetch })
			]);

			if (!client?.admin) {
				await api.collection('users').update(client.id, { congregation: record.id }, { fetch });
			}

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
