import joi from 'joi';

import type {
	AccommodationsRecord,
	CongregationMetaRecord,
	FitRecord,
	RegistrationRecord,
	SafetyRecord,
	ServicesRecord,
	UsersRecord
} from './types';

const accommodationsSchema = joi.object<AccommodationsRecord & { id: string }>({
	id: joi.string(),
	hybrid_automatedCaptions: joi.boolean(),
	hybrid_liveCaptions: joi.boolean(),
	inPerson_adaAll: joi.boolean(),
	inPerson_adaSome: joi.boolean(),
	inPerson_asl: joi.boolean(),
	inPerson_eva: joi.boolean(),
	online_asl: joi.boolean(),
	online_automatedCaptions: joi.boolean(),
	online_liveCaptions: joi.boolean(),
	other: joi.boolean(),
	otherText: joi.string().allow('')
});

const fitSchema = joi.object<FitRecord & { id: string }>({
	id: joi.string(),
	clergyMember: joi.boolean(),
	flag: joi.string().valid('no', 'yes', 'yesBima'),
	multipleClergyMembers: joi.boolean(),
	other: joi.boolean(),
	otherText: joi.string().allow(''),
	publicStatement: joi.boolean()
});

const registrationSchema = joi.object<RegistrationRecord & { id: string }>({
	id: joi.string(),
	email: joi.string().allow(''),
	otherText: joi.string().allow(''),
	registrationType: joi
		.string()
		.valid('slidingScale', 'fixedPrice', 'suggestedDonation', 'other')
		.required(),
	url: joi.string().allow('')
});

const safetySchema = joi.object<SafetyRecord & { id: string }>({
	id: joi.string(),
	protocol: joi.string().valid('maskingRequired', 'maskingRecommended', 'noGuidelines', 'other'),
	otherText: joi.string().allow('')
});

const servicesSchema = joi.object<ServicesRecord & { id: string }>({
	id: joi.string(),
	hybrid: joi.boolean(),
	inPerson: joi.boolean(),
	offsite: joi.boolean(),
	onlineOnly: joi.boolean(),
	other: joi.boolean(),
	otherText: joi.string().allow('')
});

export type DefaultSchema = CongregationMetaRecord;

export const defaultSchema = joi.object<CongregationMetaRecord & { id: string }>({
	id: joi.string(),
	city: joi.string().allow(''),
	clergy: joi.string().required(),
	contactEmail: joi.string().required(),
	contactName: joi.string().required(),
	contactUrl: joi.string().allow(''),
	country: joi.string().allow(''),
	flavor: joi.string().required(),
	name: joi.string().required(),
	notes: joi.string().allow(''),
	state: joi.string().allow(''),
	visible: joi.boolean(),
	accommodations: accommodationsSchema,
	fit: fitSchema,
	registration: registrationSchema,
	safety: safetySchema,
	services: servicesSchema
});

const password = joi
	.string()
	.min(12)
	.max(64)
	.pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\da-zA-Z]).{12,64}$'));

export type LoginSchema = {
	email: string;
	password: string;
};

export const loginSchema = joi.object<LoginSchema>({
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required(),
	password: joi.string().required()
});

export type UserSchema = UsersRecord & {
	id?: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	oldPassword?: string;
};

export const userSchema = joi.object<UserSchema>({
	id: joi.string(),
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required(),
	congregation: joi.string(),
	name: joi.string().required(),
	lang: joi.string().valid('en', 'es', 'fr', 'he'),
	password,
	oldPassword: joi.string(),
	passwordConfirm: joi.string().valid(joi.ref('password'))
});

export type TokenSchema = {
	token: string;
	email?: string;
	password?: string;
	passwordConfirm?: string;
	type: string;
};

export const tokenSchema = joi.object<TokenSchema>({
	token: joi.string().required(),
	email: joi.string().email({ tlds: { allow: false } }),
	password: joi.string(),
	passwordConfirm: joi.string().valid(joi.ref('password')),
	type: joi.string().valid('resetPassword', 'verifyEmail')
});

export const deleteSchema = joi.object({
	id: joi.string().required()
});

export const transferSchema = joi.object({
	id: joi.string().required(),
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required()
});
