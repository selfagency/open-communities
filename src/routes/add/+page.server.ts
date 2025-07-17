/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail, redirect } from '@sveltejs/kit';
import { omit } from 'radashi';
import { setError } from 'sveltekit-superforms';

import type { LocationRecord } from '$lib/location';
import type {
	AccessibilityRecord,
	CongregationMetaRecord,
	FitRecord,
	HealthRecord,
	PagesRecord,
	RegistrationRecord,
	SecurityRecord,
	ServicesRecord
} from '$lib/types';
import type { CongregationsResponse } from '$lib/types.d';

import { t } from '$lib/i18n';
import { defaultSchema } from '$lib/schemas/record';
import { handleError, loadUser } from '$lib/server/api';
import { sendMail } from '$lib/server/mail';
/* endregion imports */

/* region types */
type MetaRecord = {
	accessibility: AccessibilityRecord;
	fit: FitRecord;
	health: HealthRecord;
	location: LocationRecord;
	registration: RegistrationRecord;
	security: SecurityRecord;
	services: ServicesRecord;
	user: string;
};
/* endregion types */

export const load = async ({ cookies, fetch, locals }) => {
	const { api, validate } = locals;
	const client = loadUser(cookies);

	try {
		if (!client?.id) {
			throw new Error('Forbidden');
		}

		const content = (await api
			.collection('pages')
			.getFirstListItem(`slug="add-${client?.lang || 'en'}"`, { fetch })) as PagesRecord;

		return { content, form: { default: await validate(defaultSchema) } };
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
		const { cookies, fetch, locals } = event;
		const { api, log, validate } = locals;
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

			const { accessibility, fit, health, location, registration, security, services, user } =
				formData as MetaRecord;

			const record = (await api.collection('congregations').create(
				{
					...omit(formData, [
						'accessibility',
						'fit',
						'location',
						'registration',
						'health',
						'security',
						'services',
						'user'
					]),
					...location,
					visible: client?.admin ? formData.visible : false
				},
				{ fetch }
			)) as CongregationsResponse;

			await Promise.all([
				api
					.collection('accessibility')
					.create({ ...accessibility, congregation: record.id }, { fetch }),
				api.collection('fit').create({ ...fit, congregation: record.id }, { fetch }),
				api
					.collection('registration')
					.create({ ...registration, congregation: record.id }, { fetch }),
				api.collection('health').create({ ...health, congregation: record.id }, { fetch }),
				api.collection('security').create({ ...security, congregation: record.id }, { fetch }),
				api.collection('services').create({ ...services, congregation: record.id }, { fetch })
			]);

			if (!client?.admin) {
				await api.collection('users').update(user, { congregation: record.id }, { fetch });

				await sendMail(
					{
						email: client.email,
						message: `
						A new congregation, ${record.name}, has been submitted and requires approval:\n
						https://opencommunities.info/edit?id=${record.id}
					`,
						name: client.name as string,
						title: `New congregation submitted`
					},
					api
				);
			}

			return {
				form
			};
		} catch (error) {
			log.error('add:submit:error', error);
			const err = error as ClientResponseError;

			if (err.message === 'Failed to create record.') {
				setError(form, 'name', t.get('congregation.exists'));
			}

			return fail(err.status ?? 400, {
				form: {
					...form,
					error: err.message,
					errors: form.errors
				}
			});
		}
	}
};
