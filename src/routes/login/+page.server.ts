/* region imports */
import type { ClientResponseError } from 'pocketbase';
import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { uid } from 'radashi';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { UsersRecord } from '$lib/types';

import { dev } from '$app/environment';
import { TURNSTILE_SECRET } from '$env/static/private';
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
					errors: {
						...form.errors,
						error: err.message
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

			if (!dev) {
				const captcha = (
					await (
						await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
							body: JSON.stringify({
								secret: TURNSTILE_SECRET,
								response: form.data.captcha,
								remoteip: event.request.headers.get('CF-Connecting-IP')
							}),
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							}
						})
					).json()
				).outcome;

				if (captcha !== 'success') {
					throw new Error('Captcha failed');
				}
			}

			user = (await api.collection('users').create(
				{
					name: form.data.name as string,
					email: form.data.email as string,
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
		const { api, log } = event.locals;
		const form: SuperValidated<any> = await superValidate(event, zod(tokenSchema));

		try {
			if (!form.valid) {
				return fail(400, {
					form
				});
			}

			let res;

			if (dev) log.debug('login', form);

			switch (form.data.type) {
				case 'verifyEmail':
					res = await api.collection('users').confirmVerification(form.data.token);
					break;
				case 'requestReset':
					res = await api.collection('users').requestPasswordReset(form.data.email);
					break;
				case 'resetPassword':
					res = await api
						.collection('users')
						.confirmPasswordReset(form.data.token, form.data.password, form.data.passwordConfirm, {
							fetch
						});
					break;
			}

			if (dev) log.debug(`login:${form.data.type}`, res);

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
