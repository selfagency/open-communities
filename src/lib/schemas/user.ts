/* region imports */
import { z } from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';

import type { UsersRecord } from '$lib/types';
/* endregion imports */

/* region types */
export type UserSchema = UsersRecord & {
	id?: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	oldPassword?: string;
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
		id: z.string().optional(),
		email: z
			.string()
			.email()
			.refine((value) => !!value, {
				message: t.get('common.thingRequired', {
					thing: t.get('common.email')
				})
			}),
		congregation: z.string().optional(),
		name: z.string().refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.name')
			})
		}),
		lang: z.enum(['en', 'es', 'fr', 'he']).default('en'),
		password,
		oldPassword: z.string().optional(),
		passwordConfirm: z.string(),
		captcha: z.string().optional()
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
