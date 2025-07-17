/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { LocationMeta } from '$lib/location';

import { PROSOPO_ENDPOINT, PROSOPO_SECRET } from '$env/static/private';
import { t } from '$lib/i18n';
import { contactSchema } from '$lib/schemas/contact';
import { sendMail } from '$lib/server/mail';
import { truncateText } from '$lib/utils';
/* endregion imports */

export const load = async ({ fetch, locals }) => {
	const { api, validate } = locals;

	const congregations = (await api.collection('congregationMeta').getFullList({ fetch })).map(
		(c) => {
			const location = c.location as LocationMeta;
			const label = truncateText(
				`${c.name}${location?.city?.name ? ', ' + location.city.name : ''}${location?.state?.name ? ', ' + location.state.name : ''}${location?.country?.name ? ', ' + location.country.name : ''}`,
				38
			);
			return {
				id: c.id,
				label: truncateText(label, 38),
				value: label
			};
		}
	);

	return {
		congregations,
		form: await validate(contactSchema)
	};
};

export const actions = {
	default: async (event) => {
		const { api, log } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, zod(contactSchema));

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			const captcha = await (
				await fetch(PROSOPO_ENDPOINT, {
					body: JSON.stringify({
						secret: PROSOPO_SECRET,
						token: form.data.captcha
					}),
					headers: {
						'Content-Type': 'application/json'
					},
					method: 'POST'
				})
			).json();

			if (!captcha.verified) {
				return fail(400, {
					form: { ...form, error: 'Captcha verification failed' }
				});
			}

			try {
				await sendMail(
					{
						email: form.data.email,
						message: `
						${t.get(`common.contact.options.${form.data.reason}`)}

						${form.data.message}

						https://opencommunities.info/edit?id=${form.data.record}${form.data.reason === 'transfer' ? `&transfer=${form.data.email}` : ''}
						`,
						name: form.data.name
					},
					api
				);
			} catch (error) {
				return fail(400, {
					error,
					form
				});
			}

			return {
				form
			};
		} catch (error) {
			const err = error as ClientResponseError;
			log.error('error', err);

			return fail(err.status || 400, {
				form: {
					...form,
					error: err.message
				}
			});
		}
	}
};
