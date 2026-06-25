import { isEmpty, listify } from 'radashi';
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

/* region methods */
const valueSelected = (value: Record<string, unknown>): boolean => {
  return !listify(value, (_, value) => value).every((value) => !value);
};

const hasContact = (value: { email?: null | string; url?: null | string }): boolean => {
  return !(isEmpty(value?.email) && isEmpty(value?.url));
};
/* endregion methods */

export const accessibilitySchema = z.object({
  id: z.string().optional(),
  inPerson_adaAll: z.boolean(),
  inPerson_adaSome: z.boolean(),
  inPerson_asl: z.boolean(),
  inPerson_eva: z.boolean(),
  online_asl: z.boolean(),
  online_automatedCaptions: z.boolean(),
  online_liveCaptions: z.boolean(),
  other: z.boolean(),
  otherText: z.string().optional()
});

export type AccessibilitySchema = z.infer<typeof accessibilitySchema>;

export const fitSchema = z
  .object({
    clergyMember: z.boolean(),
    flag: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['no', 'yes', 'yesBima']).nullable().optional()),
    id: z.string().optional(),
    multipleClergyMembers: z.boolean(),
    other: z.boolean(),
    otherText: z.string().optional(),
    publicStatement: z.boolean()
  })
  .refine(valueSelected, {
    message: Lazy(() => m.requiredResponse())
  });

export type FitSchema = z.infer<typeof fitSchema>;

export const registrationSchema = z
  .object({
    email: z.string().optional(),
    id: z.string().optional(),
    otherText: z.string().optional(),
    registrationType: z
      .enum(['free', 'slidingScale', 'fixedPrice', 'suggestedDonation', 'other'])
      .refine((value) => !!value, {
        message: Lazy(() => m.requiredResponse())
      }),
    url: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().nullable().optional())
  })
  .refine(hasContact, {
    message: Lazy(() => m.thingRequired({ thing: m.emailOrUrl() }))
  });

export type RegistrationSchema = z.infer<typeof registrationSchema>;

export const healthSchema = z.object({
  id: z.string().optional(),
  otherText: z.string().optional(),
  protocol: z.enum(['maskingRequired', 'maskingRecommended', 'noGuidelines', 'other']).refine((value) => !!value, {
    message: Lazy(() => m.requiredResponse())
  })
});

export type HealthSchema = z.infer<typeof healthSchema>;

export const securitySchema = z.object({
  clergyArmed: z.boolean(),
  congregantsArmed: z.boolean(),
  id: z.string().optional(),
  localPolice: z.boolean(),
  noFirearms: z.boolean(),
  other: z.boolean(),
  otherText: z.string().optional(),
  privateSecurityArmed: z.boolean(),
  privateSecurityUnarmed: z.boolean()
});

export type SecuritySchema = z.infer<typeof securitySchema>;

export const servicesSchema = z
  .object({
    hybrid: z.boolean(),
    id: z.string().optional(),
    inPerson: z.boolean(),
    offsite: z.boolean(),
    onlineOnly: z.boolean(),
    other: z.boolean(),
    otherText: z.string().optional()
  })
  .refine(valueSelected, {
    message: Lazy(() => m.requiredResponse())
  });

export type ServicesSchema = z.infer<typeof servicesSchema>;
