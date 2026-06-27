/* region imports */
// biome-ignore lint/performance/noNamespaceImport: Zod namespace convention
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

export const loginSchema = z.object({
  email: z.email().refine((value) => !!value, {
    message: Lazy(() =>
      m.thingRequired({
        thing: m.email()
      })
    )
  }),
  password: z.string().refine((value) => !!value, {
    message: Lazy(() =>
      m.thingRequired({
        thing: m.password()
      })
    )
  })
});

// fallow-ignore-next-line unused-type -- used via app.d.ts
export type LoginSchema = z.infer<typeof loginSchema>;

export const tokenSchema = z
  .object({
    email: z.email().optional(),
    password: z.string().optional(),
    passwordConfirm: z.string().optional(),
    token: z.string().refine((value) => !!value, {
      message: Lazy(() =>
        m.thingRequired({
          thing: m.token()
        })
      )
    }),
    type: z.enum(['requestReset', 'resetPassword', 'verifyEmail'])
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

// fallow-ignore-next-line unused-type -- used via app.d.ts
export type TokenSchema = z.infer<typeof tokenSchema>;
