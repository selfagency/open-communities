/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';

import type { LocationMeta } from '$lib/types.d';

import { CAPTCHA_SITE_SECRET } from '$env/static/private';
import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
import { m } from '$lib/paraglide/messages';
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
		const form = await event.locals.validate(contactSchema, event);

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			if (!form.data.captcha) {
				setError(form, 'captcha', m.invalidCaptcha());
				return fail(400, { form });
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
					setError(form, 'captcha', m.invalidCaptcha());
					return fail(400, { form });
				}
			}

			try {
				await sendMail(
					{
						email: form.data.email,
						message: `
						${m[`contact.options.${form.data.reason}`]()}

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
