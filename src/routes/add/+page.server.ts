/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { redirect, fail } from '@sveltejs/kit';
import { omit } from 'radashi';
import { setError } from 'sveltekit-superforms';

import type { LocationRecord } from '$lib/location';
import type {
	CongregationMetaRecord,
	PagesRecord,
	AccessibilityRecord,
	FitRecord,
	RegistrationRecord,
	HealthRecord,
	SecurityRecord,
	ServicesRecord
} from '$lib/types';

import { PROSOPO_SECRET, PROSOPO_ENDPOINT } from '$env/static/private';
import { t } from '$lib/i18n';
import { defaultSchema } from '$lib/schemas/record';
import { loadUser, handleError } from '$lib/server/api';
import { sendMail } from '$lib/server/mail';
/* endregion imports */

/* region types */
type MetaRecord = {
	accessibility: AccessibilityRecord;
	fit: FitRecord;
	location: LocationRecord;
	registration: RegistrationRecord;
	health: HealthRecord;
	security: SecurityRecord;
	services: ServicesRecord;
	user: string;
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
		const { api, validate, log } = locals;
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

			const { accessibility, fit, location, registration, health, security, services, user } =
				formData as MetaRecord;

			const record = await api.collection('congregations').create(
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
			);

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
						name: client.name,
						email: client.email,
						title: `New congregation submitted`,
						message: `
						A new congregation, ${record.name}, has been submitted and requires approval:\n
						https://opencommunities.info/edit?id=${record.id}
					`
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
