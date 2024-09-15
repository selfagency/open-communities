/* region imports */
import { isEmpty } from 'radashi';
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
const fitCheck = (value: any) => {
	if (
		!isEmpty(value) &&
		!value?.clergyMember &&
		!value?.multipleClergyMembers &&
		!value?.other &&
		!value?.publicStatement
	) {
		return false;
	}
	return true;
};

const registrationCheck = (value: any) => {
	return !isEmpty(value?.email) && !isEmpty(value?.url);
};

const safetyCheck = (value: any) => {
	if (isEmpty(value?.protocol)) return false;

	if (value?.protocol === 'other' && isEmpty(value?.otherText)) {
		return false;
	}

	return true;
};

const servicesCheck = (value: any) => {
	if (
		!isEmpty(value) &&
		!value?.hybrid &&
		!value?.inPerson &&
		!value?.offsite &&
		!value?.onlineOnly &&
		!value?.other
	) {
		return false;
	}

	if (value?.other && isEmpty(value?.otherText)) {
		return false;
	}

	return true;
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
		flag: z.enum(['no', 'yes', 'yesBima']).optional(),
		multipleClergyMembers: z.boolean(),
		other: z.boolean(),
		otherText: z.string().optional(),
		publicStatement: z.boolean()
	})
	.refine(fitCheck, {
		message: t.get('common.required'),
		path: ['fitCheck']
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
		url: z.string().url().nullable().optional()
	})
	.refine(registrationCheck, {
		message: t.get('common.thingRequired', { thing: t.get('common.emailOrUrl') }),
		path: ['registrationCheck']
	});

const safetySchema = z
	.object({
		id: z.string().optional(),
		protocol: z
			.enum(['maskingRequired', 'maskingRecommended', 'noGuidelines', 'other'])
			.refine((value) => !!value, {
				message: t.get('common.required')
			}),
		otherText: z.string().optional()
	})
	.refine(safetyCheck, {
		message: t.get('common.thingRequired', { thing: t.get('common.otherText') }),
		path: ['safetyCheck']
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
	.refine(servicesCheck, {
		message: t.get('common.thingRequired', { thing: t.get('common.otherText') }),
		path: ['servicesCheck']
	});

export const defaultSchema = z.object({
	id: z.string().optional(),
	clergy: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.clergy.clergy')
		})
	}),
	contactEmail: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.contactEmail.contactEmail')
		})
	}),
	contactName: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.contactName.contactName')
		})
	}),
	contactUrl: z.string().url().nullable().optional(),
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
		city: z.string(),
		country: z.string(),
		state: z.string()
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
		passwordConfirm: z.string().optional()
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
