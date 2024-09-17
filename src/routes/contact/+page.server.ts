/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { LocationMeta } from '$lib/location';

import { PROSOPO_SECRET, PROSOPO_ENDPOINT } from '$env/static/private';
import { contactSchema } from '$lib/schemas';
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

			const formData = new FormData();
			formData.append('name', form.data.name);
			formData.append('email', form.data.email);
			formData.append('message', form.data.message);
			formData.append('reason', form.data.reason);
			formData.append('record', form.data.record);

			let record;
			if (form.data.record && form.data.record !== '') {
				record = await api.collection('congregationMeta').getOne(form.data.record, { fetch });
				const location = record.location as LocationMeta;

				formData.append('congregation', record.name);
				formData.append('congregationId', record.id);
				formData.append('congregationCity', location.city?.name || '');
				formData.append('congregationState', location.state?.name || '');
				formData.append('congregationCountry', location.country?.name || '');
			}

			const res = await fetch('https://usebasin.com/f/a0498e979c2a', {
				method: 'POST',
				headers: {
					Accept: 'application/json'
				},
				body: formData
			});

			if (res.status !== 200) {
				return fail(400, {
					form,
					error: await res.json()
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
