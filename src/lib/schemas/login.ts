/* region imports */
import * as z from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';
/* endregion imports */

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

export type LoginSchema = z.infer<typeof loginSchema>;

export const tokenSchema = z
	.object({
		email: z.string().email().optional(),
		password: z.string().optional(),
		passwordConfirm: z.string().optional(),
		token: z.string().refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.token')
			})
		}),
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

export type TokenSchema = z.infer<typeof tokenSchema>;
