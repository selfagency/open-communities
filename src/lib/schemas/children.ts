/* region imports */
import { isEmpty, listify } from 'radashi';
import { z } from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';
/* endregion imports */

/* region methods */
const valueSelected = (value: any) => {
	return !listify(value, (_, value) => value).every((value) => !value);
};

const hasContact = (value: any) => {
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

export const fitSchema = z
	.object({
		id: z.string().optional(),
		clergyMember: z.boolean(),
		flag: z.preprocess(
			(val) => (val === '' ? undefined : val),
			z.enum(['no', 'yes', 'yesBima']).nullable().optional()
		),
		multipleClergyMembers: z.boolean(),
		other: z.boolean(),
		otherText: z.string().optional(),
		publicStatement: z.boolean()
	})
	.refine(valueSelected, {
		message: t.get('common.requiredResponse')
	});

export const registrationSchema = z
	.object({
		id: z.string().optional(),
		email: z.string().optional(),
		otherText: z.string().optional(),
		registrationType: z
			.enum(['free', 'slidingScale', 'fixedPrice', 'suggestedDonation', 'other'])
			.refine((value) => !!value, {
				message: t.get('common.requiredResponse')
			}),
		url: z.preprocess(
			(val) => (val === '' ? undefined : val),
			z.string().url().nullable().optional()
		)
	})
	.refine(hasContact, {
		message: t.get('common.thingRequired', { thing: t.get('common.emailOrUrl') })
	});

export const healthSchema = z.object({
	id: z.string().optional(),
	protocol: z
		.enum(['maskingRequired', 'maskingRecommended', 'noGuidelines', 'other'])
		.refine((value) => !!value, {
			message: t.get('common.requiredResponse')
		}),
	otherText: z.string().optional()
});

export const securitySchema = z.object({
	id: z.string().optional(),
	localPolice: z.boolean(),
	privateSecurityArmed: z.boolean(),
	privateSecurityUnarmed: z.boolean(),
	clergyArmed: z.boolean(),
	congregantsArmed: z.boolean(),
	noFirearms: z.boolean(),
	other: z.boolean(),
	otherText: z.string().optional()
});

export const servicesSchema = z
	.object({
		id: z.string().optional(),
		hybrid: z.boolean(),
		inPerson: z.boolean(),
		offsite: z.boolean(),
		onlineOnly: z.boolean(),
		other: z.boolean(),
		otherText: z.string().optional()
	})
	.refine(valueSelected, {
		message: t.get('common.requiredResponse')
	});
