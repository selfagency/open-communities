/* region imports */
import { z } from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';
/* endregion imports */

/* region types */
export type LoginSchema = {
	email: string;
	password: string;
};

export type TokenSchema = {
	token: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	type: string;
};
/* endregion types */

export const loginSchema = z.object({
	email: z
		.string()
		.email()
		.refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.email')
			})
		}),
	password: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('auth.password')
		})
	})
});

export const tokenSchema = z
	.object({
		token: z.string().refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.token')
			})
		}),
		email: z.string().email().optional(),
		password: z.string().optional(),
		passwordConfirm: z.string().optional(),
		type: z.string()
	})
	.superRefine((data, ctx) => {
		if (data.passwordConfirm !== data.password) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t.get('auth.passwordMismatch'),
				path: ['passwordConfirm']
			});
		}
	});
