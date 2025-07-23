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

import { CAPTCHA_SITE_SECRET } from '$env/static/private';
import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
import { m } from '$lib/paraglide/messages';
import { defaultSchema } from '$lib/schemas/record';
import { handleError } from '$lib/server/api';
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

			if (!form.data.captcha) {
				throw new Error('Invalid captcha');
			} else {
				const captchaValid = (
					await (
						await fetch(`https://captcha.selfagency.dev/${PUBLIC_CAPTCHA_SITE_KEY}/siteverify`, {
							body: JSON.stringify({
								response: form.data.captcha as string,
								secret: CAPTCHA_SITE_SECRET as string
							}),
							headers: {
								'Content-Type': 'application/json'
							},
							method: 'POST'
						})
					)?.json()
				)?.success;

				if (!captchaValid) {
					throw new Error('Invalid captcha');
				}
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
