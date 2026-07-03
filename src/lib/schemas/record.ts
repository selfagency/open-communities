/* region imports */
// biome-ignore lint/performance/noNamespaceImport: Zod namespace convention
import * as z from 'zod';

import { m } from '$lib/paraglide/messages';

import { Lazy } from './_shared';
import {
  accessibilitySchema as accessibility,
  fitSchema as fit,
  healthSchema as health,
  registrationSchema as registration,
  securitySchema as security,
  servicesSchema as services
} from './children';

/* endregion imports */

export const deleteSchema = z.object({
  id: z.string().refine((value) => !!value, {
    message: Lazy(() => m.thingRequired({ thing: '`id`' }))
  })
});

export const defaultSchema = z.object({
  accessibility,
  captcha: z.string().nullable().optional(),
  clergy: z.string().refine((value) => !!value, {
    message: Lazy(() => m.thingRequired({ thing: m.clergy_clergy() }))
  }),
  contactEmail: z.preprocess((val) => (val === '' ? undefined : val), z.email().optional()),
  contactName: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  contactUrl: z.preprocess((val) => (val === '' ? undefined : val), z.url().nullable().optional()),
  denomination: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z
      .enum([
        'reform',
        'conservative',
        'orthodox',
        'reconstructionist',
        'renewal',
        'unaffiliated',
        'postDenominational',
        'multiDenominational',
        'humanist',
        'other'
      ])
      .nullable()
      .optional()
  ),
  fit,
  flavor: z.string().refine((value) => !!value, {
    message: Lazy(() => m.thingRequired({ thing: m.flavor() }))
  }),
  health,
  id: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
    state: z.string().optional()
  }),
  name: z.string().refine((value) => !!value, {
    message: Lazy(() => m.thingRequired({ thing: m.name() }))
  }),
  notes: z.string().optional(),
  owner: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  registration,
  security,
  services,
  visible: z.boolean()
});

// fallow-ignore-next-line unused-type -- used via app.d.ts
export type DefaultSchema = z.infer<typeof defaultSchema>;
