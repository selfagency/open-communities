/* region imports */
import type { ClientResponseError } from 'pocketbase';

import { fail } from '@sveltejs/kit';
import { uid } from 'radashi';

import type { UsersRecord } from '$lib/pocketbase.d';

// import { dev } from '$app/environment';
import { cleanResponse } from '$lib/api';
import { loginSchema, tokenSchema } from '$lib/schemas/login';
import { userSchema } from '$lib/schemas/user';

import type { PageServerLoad } from './$types';
// import { log } from '$lib/server/logger';
/* endregion imports */

export const load: PageServerLoad = async ({ locals }) => {
	return {
		login: await locals.validate(loginSchema),
		reset: await locals.validate(tokenSchema),
		signup: await locals.validate(userSchema),
		verify: await locals.validate(tokenSchema)
	};
};

export const actions = {
	acct: async (event) => {
		const { api } = event.locals;
		const form = await event.locals.validate(tokenSchema, event);

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			// let res;
			switch (form.data.type) {
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
				case 'verifyEmail':
					await api.collection('users').confirmVerification(form.data.token);
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
	},
	login: async (event) => {
		const { cookies, fetch, locals } = event;
		const { api, cookieOpts } = locals;

		const form = await locals.validate(loginSchema, event);
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
		const { api, validate } = event.locals;
		const form = await validate(userSchema, event);
		let user: UsersRecord;

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			user = (await api.collection('users').create(
				{
					email: form.data.email as string,
					emailVisibility: form.data.emailVisibility as boolean,
					lang: form.data.lang as string,
					name: form.data.name as string,
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
	}
};
