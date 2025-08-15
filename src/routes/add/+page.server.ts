/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail, redirect } from '@sveltejs/kit';
import { omit } from 'radashi';
import { setError } from 'sveltekit-superforms';

import type {
	AccessibilityRecord,
	CongregationMetaRecord,
	CongregationsResponse,
	FitRecord,
	HealthRecord,
	PagesRecord,
	RegistrationRecord,
	SecurityRecord,
	ServicesRecord
} from '$lib/pocketbase.d';
import type { LocationRecord } from '$lib/types.d';

import * as m from '$lib/paraglide/messages';
import { defaultSchema } from '$lib/schemas/record';
import { handleError } from '$lib/server/api';
import { adminMail, transactionalMail } from '$lib/server/mail';
import { validateCaptcha } from '$lib/server/utils';
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

export const load = async ({ fetch, locals }) => {
	const { api, validate } = locals;
	const client = api.authStore.record;

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
		const { fetch, locals } = event;
		const { api, log, validate } = locals;
		const client = api.authStore.record;

		const form = await validate(defaultSchema, event);
		const formData = form.data as CongregationMetaRecord & MetaRecord;

		try {
			if (!client?.id) {
				throw new Error('Forbidden');
			}

			if (!form.valid) {
				throw new Error('Invalid form data');
			}

			const captchaValid = await validateCaptcha(form);

			if (captchaValid) {
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

				const batch = api.createBatch();
				batch
					.collection('accessibility')
					.create({ ...accessibility, congregation: record.id }, { fetch });
				batch.collection('fit').create({ ...fit, congregation: record.id }, { fetch });
				batch
					.collection('registration')
					.create({ ...registration, congregation: record.id }, { fetch });
				batch.collection('health').create({ ...health, congregation: record.id }, { fetch });
				batch.collection('security').create({ ...security, congregation: record.id }, { fetch });
				batch.collection('services').create({ ...services, congregation: record.id }, { fetch });
				await batch.send();

				await api.collection('users').update(user, { congregation: record.id }, { fetch });

				if (!client?.admin) {
					await transactionalMail({
						email: client.email,
						message: `${m['transactional.submitted']({ locale: client.lang || 'en' })} ${m['transactional.confirmation']({ locale: client.lang || 'en' })}`,
						name: client.name as string,
						subject: `${m['transactional.subject']({ locale: client.lang || 'en' })}`
					});
				}

				await adminMail(
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
			} else {
				throw new Error('Invalid captcha');
			}

			return {
				form
			};
		} catch (error) {
			log.error('add:submit:error', error);
			const err = error as ClientResponseError;

			if (err.message === 'Invalid captcha') {
				setError(form, 'captcha', m.invalidCaptcha());
			}

			if (err.message === 'Failed to create record.') {
				setError(form, 'name', m.exists());
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
