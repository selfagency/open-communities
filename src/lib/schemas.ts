/* region imports */
import { isEmpty } from 'radashi';
import { listify } from 'radashi';
import { z } from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';

import type { CongregationMetaRecord, UsersRecord } from '$lib/types';
/* endregion imports */

/* region types */
export type DefaultSchema = CongregationMetaRecord;

export type LoginSchema = {
	email: string;
	password: string;
};

export type UserSchema = UsersRecord & {
	id?: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	oldPassword?: string;
};

export type TokenSchema = {
	token: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	type: string;
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

/* region methods */
const valueSelected = (value: any) => {
	return !listify(value, (_, value) => value).every((value) => !value);
};

const hasContact = (value: any) => {
	return !(isEmpty(value?.email) && isEmpty(value?.url));
};
/* endregion methods */

const accommodationsSchema = z.object({
	id: z.string().optional(),
	hybrid_automatedCaptions: z.boolean(),
	hybrid_liveCaptions: z.boolean(),
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

const fitSchema = z
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
		message: t.get('common.required')
	});

const registrationSchema = z
	.object({
		id: z.string().optional(),
		email: z.string().optional(),
		otherText: z.string().optional(),
		registrationType: z
			.enum(['slidingScale', 'fixedPrice', 'suggestedDonation', 'other'])
			.refine((value) => !!value, {
				message: t.get('common.required')
			}),
		url: z.preprocess(
			(val) => (val === '' ? undefined : val),
			z.string().url().nullable().optional()
		)
	})
	.refine(hasContact, {
		message: t.get('common.thingRequired', { thing: t.get('common.emailOrUrl') })
	});

const safetySchema = z.object({
	id: z.string().optional(),
	protocol: z
		.enum(['maskingRequired', 'maskingRecommended', 'noGuidelines', 'other'])
		.refine((value) => !!value, {
			message: t.get('common.required')
		}),
	otherText: z.string().optional()
});

const servicesSchema = z
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
		message: t.get('common.required')
	});

export const defaultSchema = z.object({
	id: z.string().optional(),
	clergy: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.clergy.clergy')
		})
	}),
	contactEmail: z.string().email().optional(),
	contactName: z.string().optional(),
	contactUrl: z.preprocess(
		(val) => (val === '' ? undefined : val),
		z.string().url().nullable().optional()
	),
	flavor: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.flavor.flavor')
		})
	}),
	name: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('common.name')
		})
	}),
	notes: z.string().optional(),
	visible: z.boolean(),
	location: z.object({
		city: z.string().optional(),
		country: z.string().optional(),
		state: z.string().optional()
	}),
	accommodations: accommodationsSchema,
	fit: fitSchema,
	registration: registrationSchema,
	safety: safetySchema,
	services: servicesSchema
});

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

export const tokenSchema = z
	.object({
		token: z.string().refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.token')
			})
		}),
		email: z.string().email().optional(),
		password: z.string().optional(),
		passwordConfirm: z.string().optional(),
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

export const deleteSchema = z.object({
	id: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: '`id`'
		})
	})
});

export const transferSchema = z.object({
	id: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: '`id`'
		})
	}),
	email: z
		.string()
		.email()
		.refine((value) => !!value, {
			message: t.get('common.thingRequired', {
				thing: t.get('common.email')
			})
		})
});
