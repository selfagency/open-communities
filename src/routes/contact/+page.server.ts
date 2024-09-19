/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { LocationMeta } from '$lib/location';

import { PROSOPO_SECRET, PROSOPO_ENDPOINT } from '$env/static/private';
import { contactSchema } from '$lib/schemas/contact';
import { sendMail } from '$lib/server/mail';
import { truncateText } from '$lib/utils';
/* endregion imports */

export const load = async ({ locals, fetch }) => {
	const { api, validate } = locals;

	const congregations = (await api.collection('congregationMeta').getFullList({ fetch })).map(
		(c) => {
			const location = c.location as LocationMeta;
			const label = truncateText(
				`${c.name}${location?.city?.name ? ', ' + location.city.name : ''}${location?.state?.name ? ', ' + location.state.name : ''}${location?.country?.name ? ', ' + location.country.name : ''}`,
				38
			);
			return {
				label: truncateText(label, 38),
				value: label,
				id: c.id
			};
		}
	);

	return {
		form: await validate(contactSchema),
		congregations
	};
};

export const actions = {
	default: async (event) => {
		const { log, api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, zod(contactSchema));

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
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

			try {
				await sendMail(
					{
						name: form.data.name,
						email: form.data.email,
						reason: form.data.reason,
						message: form.data.message,
						record: form.data.record
					},
					api
				);
			} catch (error) {
				return fail(400, {
					form,
					error
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
