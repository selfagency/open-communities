/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { joi } from 'sveltekit-superforms/adapters';

import type { UsersRecord } from '$lib/types';

import { cleanResponse } from '$lib/api';
import { loginSchema, userSchema, tokenSchema } from '$lib/schemas';
/* endregion imports */

export const load = async ({ locals }) => {
	return {
		form: {
			login: await locals.validate(loginSchema),
			signup: await locals.validate(userSchema),
			verify: await locals.validate(tokenSchema),
			reset: await locals.validate(tokenSchema)
		}
	};
};

export const actions = {
	login: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, joi(loginSchema));
		let user: UsersRecord;

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

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
	},
	signup: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, joi(userSchema));
		let user: UsersRecord;

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			user = (await api.collection('users').create({
				name: form.data.name as string,
				email: form.data.email as string,
				password: form.data.password as string,
				passwordConfirm: form.data.passwordConfirm as string
			})) as UsersRecord;

			await api.collection('users').requestVerification(form.data.email as string);

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
	},
	acct: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, joi(tokenSchema));

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			switch (form.data.type) {
				case 'verifyEmail':
					await api.collection('users').confirmVerification(form.data.token);
					break;
				case 'requestReset':
					await api.collection('users').requestPasswordReset(form.data.email);
					break;
				case 'resetPassword':
					await api
						.collection('users')
						.confirmPasswordReset(form.data.token, form.data.password, form.data.passwordConfirm);
					break;
			}

			return {
				form
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
