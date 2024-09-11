/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { joi } from 'sveltekit-superforms/adapters';

import type { UsersRecord } from '$lib/types';

import { cleanResponse } from '$lib/api';
import { loginSchema } from '$lib/schemas';
/* endregion imports */

export const load = async ({ locals }) => {
	const form = await locals.validate(loginSchema);

	return { form };
};

export const actions = {
	default: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, joi(loginSchema));
		let user: UsersRecord;

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			user = cleanResponse(
				(
					await api
						.collection('users')
						.authWithPassword(form.data.email as string, form.data.password as string)
				).record
			) as UsersRecord;

			return {
				form,
				user
			};
		} catch (error) {
			const err = error as ClientResponseError;

			return fail(err.status, {
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
