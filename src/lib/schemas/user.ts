import * as z from 'zod';

// import { log } from '$lib/utils';
import { m } from '$lib/paraglide/messages';
/* endregion imports */

/* region variables */
// constants
const password = z
	.string()
	.min(12, { message: m.passwordRequirementsFailed() })
	.max(64, { message: m.passwordRequirementsFailed() })
	.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/, {
		message: m.passwordRequirementsFailed()
	});
/* endregion variables */

export const userSchema = z
	.object({
		captcha: z.string().optional(),
		congregation: z.string().optional(),
		email: z.email().refine((value) => !!value, {
			message: m.thingRequired({ thing: m.email() })
		}),
		emailVisibility: z.boolean().default(true),
		id: z.string().optional(),
		lang: z.enum(['en', 'es', 'fr', 'he']).default('en'),
		name: z.string().refine((value) => !!value, {
			message: m.thingRequired({ thing: m.name() })
		}),
		oldPassword: z.string().optional(),
		password,
		passwordConfirm: z.string()
	})
	.superRefine((data, ctx) => {
		if (data.passwordConfirm !== data.password) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: m.passwordMismatch(),
				path: ['passwordConfirm']
			});
		}
	});

export type UserSchema = z.infer<typeof userSchema>;
