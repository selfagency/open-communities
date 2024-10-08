/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { UsersRecord } from '$lib/types';

// import { dev } from '$app/environment';
import { PROSOPO_SECRET, PROSOPO_ENDPOINT } from '$env/static/private';
import { cleanResponse } from '$lib/api';
import { loginSchema, tokenSchema } from '$lib/schemas/login';
import { userSchema } from '$lib/schemas/user';
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
		const { cookies, fetch, locals } = event;
		const { api, cookieOpts } = locals;

		const form: SuperValidated<any> = await superValidate(event, zod(loginSchema));
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
						.authWithPassword(form.data.email as string, form.data.password as string, { fetch })
				).record
			) as UsersRecord;

			// cookies.set('remember', remember ? (username as string) : '', cookieOpts);
			cookies.set('auth', api.authStore.exportToCookie(), cookieOpts);
			cookies.set('session', uid(32), cookieOpts);

			return {
				form,
				user
			};
		} catch (error) {
			const err = error as ClientResponseError;

			return fail(err.status, {
				form: {
					...form,
					error: err.message,
					errors: {
						...form.errors
					}
				}
			});
		}
	},
	logout: async (event) => {
		const { cookies, locals } = event;

		cookies.set('auth', '', locals.cookieOpts);
		cookies.set('session', '', locals.cookieOpts);

		return {};
	},
	signup: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, zod(userSchema));
		let user: UsersRecord;

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
					form,
					errors: {
						captcha: ['Captcha verification failed']
					}
				});
			}

			user = (await api.collection('users').create(
				{
					name: form.data.name as string,
					email: form.data.email as string,
					lang: form.data.lang as string,
					emailVisibility: form.data.emailVisibility as boolean,
					password: form.data.password as string,
					passwordConfirm: form.data.passwordConfirm as string
				},
				{ fetch }
			)) as UsersRecord;

			await api.collection('users').requestVerification(form.data.email as string, { fetch });

			return {
				form,
				user
			};
		} catch (error) {
			const err = error as ClientResponseError;

			return fail(err.status || 400, {
				form: {
					...form,
					error: err.message,
					errors: {
						...form.errors
					}
				}
			});
		}
	},
	acct: async (event) => {
		const { api } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, zod(tokenSchema));

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			// let res;
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
						.confirmPasswordReset(form.data.token, form.data.password, form.data.passwordConfirm, {
							fetch
						});
					break;
			}

			// if (dev) log.debug(`login:${form.data.type}`, res);

			return {
				form
			};
		} catch (error) {
			const err = error as ClientResponseError;

			return fail(err.status ?? 400, {
				form: {
					...form,
					error: err.message,
					errors: {
						...form.errors
					}
				}
			});
		}
	}
};
