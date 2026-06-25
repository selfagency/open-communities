import * as z from 'zod';

import { m } from '$lib/paraglide/messages';

/* endregion imports */

function Lazy(fn: () => string): string {
  try {
    return fn();
  } catch {
    return '';
  }
}

/* region variables */
// constants
const password = z
  .string()
  .min(12, { message: Lazy(() => m.passwordRequirementsFailed()) })
  .max(64, { message: Lazy(() => m.passwordRequirementsFailed()) })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,64}$/, {
    message: Lazy(() => m.passwordRequirementsFailed())
  });
/* endregion variables */

export const userSchema = z
  .object({
    captcha: z.string().optional(),
    congregation: z.string().optional(),
    email: z.email().refine((value) => !!value, {
      message: Lazy(() => m.thingRequired({ thing: m.email() }))
    }),
    emailVisibility: z.boolean().default(true),
    id: z.string().optional(),
    lang: z.enum(['en', 'es', 'fr', 'he', 'de', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk']).default('en'),
    name: z.string().refine((value) => !!value, {
      message: Lazy(() => m.thingRequired({ thing: m.name() }))
    }),
    notifications: z.boolean().default(true),
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
