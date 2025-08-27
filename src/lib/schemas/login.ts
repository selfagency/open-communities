/* region imports */
import * as z from 'zod';

import { m } from '$lib/paraglide/messages';
// import { log } from '$lib/utils';
/* endregion imports */

export const loginSchema = z.object({
  email: z.email().refine((value) => !!value, {
    message: m.thingRequired({
      thing: m.email()
    })
  }),
  password: z.string().refine((value) => !!value, {
    message: m.thingRequired({
      thing: m.password()
    })
  })
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const tokenSchema = z
  .object({
    email: z.email().optional(),
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
    token: z.string().refine((value) => !!value, {
      message: m.thingRequired({
        thing: m.token()
      })
    }),
    type: z.string()
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

export type TokenSchema = z.infer<typeof tokenSchema>;
