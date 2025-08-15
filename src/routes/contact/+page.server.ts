/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail } from '@sveltejs/kit';

import type { LocationMeta } from '$lib/types.d';

import { m } from '$lib/paraglide/messages';
import { contactSchema } from '$lib/schemas/contact';
import { adminMail } from '$lib/server/mail';
import { validateCaptcha } from '$lib/server/utils';
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
		const form = await event.locals.validate(contactSchema, event);

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			await validateCaptcha(form);

			try {
				await adminMail(
					{
						email: form.data.email,
						message: `
						${m[`contactOptions_${form.data.reason}`]()}

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
