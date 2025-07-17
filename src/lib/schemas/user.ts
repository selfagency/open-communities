/* region imports */
import { z } from 'zod';

import type { UsersRecord } from '$lib/types';
// import { log } from '$lib/utils';

import { t } from '$lib/i18n';
/* endregion imports */

/* region types */
export type UserSchema = UsersRecord & {
	email?: string;
	id?: string;
	oldPassword?: string;
	password?: string;
	passwordConfirm?: string;
};
/* endregion types */

/* region variables */
// constants
const password = z
	.string()
	.min(12)
	.max(64)
	.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/);
/* endregion variables */

export const userSchema = z
	.object({
		captcha: z.string().optional(),
		congregation: z.string().optional(),
		email: z
			.string()
			.email()
			.refine((value) => !!value, {
				message: t.get('common.thingRequired', {
					thing: t.get('common.email')
				})
			}),
		emailVisibility: z.boolean().default(true),
		id: z.string().optional(),
		lang: z.enum(['en', 'es', 'fr', 'he']).default('en'),
		name: z.string().refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.name')
			})
		}),
		oldPassword: z.string().optional(),
		password,
		passwordConfirm: z.string()
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
