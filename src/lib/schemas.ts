/* region imports */
import joi from 'joi';

import { t } from '$lib/i18n';
import { log } from '$lib/utils';

import type {
	AccommodationsRecord,
	CongregationMetaRecord,
	FitRecord,
	RegistrationRecord,
	SafetyRecord,
	ServicesRecord,
	UsersRecord
} from './types';
/* endregion imports */

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

const fitSchema = joi
	.object<FitRecord & { id: string }>({
		id: joi.string(),
		clergyMember: joi.boolean().required(),
		flag: joi.string().valid('no', 'yes', 'yesBima'),
		multipleClergyMembers: joi.boolean().required(),
		other: joi.boolean().required(),
		otherText: joi.string().allow('').required(),
		publicStatement: joi.boolean().required()
	})
	.custom((value, helpers) => {
		if (
			!value.clergyMember &&
			!value.multipleClergyMembers &&
			!value.other &&
			!value.publicStatement
		) {
			return helpers.error('any.custom', { message: t.get('base.common.required') });
		}
		return value;
	})
	.messages({
		'any.custom': t.get('base.common.required')
	});

const registrationSchema = joi
	.object<RegistrationRecord & { id: string }>({
		id: joi.string(),
		email: joi.string().allow(''),
		otherText: joi.string().allow(''),
		registrationType: joi
			.string()
			.valid('slidingScale', 'fixedPrice', 'suggestedDonation', 'other')
			.required()
			.messages({
				'any.only': t.get('base.common.required')
			}),
		url: joi
			.string()
			.uri()
			.allow('')
			.messages({ 'string.uri': t.get('base.common.invalidUrl') })
	})
	.or('email', 'url')
	.custom((value, helpers) => {
		if (value.email === '' && value.url === '') {
			return helpers.error('any.custom', {
				message: t.get('base.common.thingRequired', { thing: t.get('base.common.emailOrUrl') })
			});
		}
		return value;
	});

const safetySchema = joi
	.object<SafetyRecord & { id: string }>({
		id: joi.string(),
		protocol: joi
			.string()
			.valid('maskingRequired', 'maskingRecommended', 'noGuidelines', 'other')
			.required()
			.messages({
				'any.only': t.get('base.common.required')
			}),
		otherText: joi.string().allow('')
	})
	.custom((value, helpers) => {
		if (value.protocol === '') {
			return helpers.error('any.custom', { message: t.get('base.common.required') });
		}
		if (value.protocol === 'other' && value.otherText === '') {
			return helpers.error('any.custom', {
				message: t.get('base.common.thingRequired', { thing: t.get('base.common.otherText') })
			});
		}
		return value;
	});

const servicesSchema = joi
	.object<ServicesRecord & { id: string }>({
		id: joi.string(),
		hybrid: joi.boolean(),
		inPerson: joi.boolean(),
		offsite: joi.boolean(),
		onlineOnly: joi.boolean(),
		other: joi.boolean(),
		otherText: joi.string().allow('')
	})
	.or('hybrid', 'inPerson', 'offsite', 'onlineOnly', 'other')
	.custom((value, helpers) => {
		if (!value.hybrid && !value.inPerson && !value.offsite && !value.onlineOnly && !value.other) {
			return helpers.error('any.custom', { message: t.get('base.common.required') });
		}

		if (value.other && value.otherText === '') {
			return helpers.error('any.custom', {
				message: t.get('base.common.thingRequired', { thing: t.get('base.common.otherText') })
			});
		}
		return value;
	});

export type DefaultSchema = CongregationMetaRecord;

export const defaultSchema = joi.object<CongregationMetaRecord & { id: string }>({
	id: joi.string(),
	city: joi.string().allow(''),
	clergy: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.clergy.clergy')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.clergy.clergy')
			})
		}),
	contactEmail: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.contactEmail.contactEmail')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.contactEmail.contactEmail')
			})
		}),
	contactName: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.contactName.contactName')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.contactName.contactName')
			})
		}),
	contactUrl: joi
		.string()
		.uri()
		.allow('')
		.messages({ 'string.uri': t.get('base.common.invalidUrl') }),
	country: joi.string().allow(''),
	flavor: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.required'),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.congregation.flavor.flavor')
			})
		}),
	name: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.name')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.name')
			})
		}),
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
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			})
		}),
	password: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.auth.password')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.auth.password')
			})
		})
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
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			})
		}),
	congregation: joi.string(),
	name: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.name')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.name')
			})
		}),
	lang: joi.string().valid('en', 'es', 'fr', 'he').default('en'),
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
	token: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.token')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.token')
			})
		}),
	email: joi.string().email({ tlds: { allow: false } }),
	password: joi.string(),
	passwordConfirm: joi.string().valid(joi.ref('password')),
	type: joi.string().valid('resetPassword', 'verifyEmail')
});

export const deleteSchema = joi.object({
	id: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: '`id`'
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: '`id`'
			})
		})
});

export const transferSchema = joi.object({
	id: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: '`id`'
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: '`id`'
			})
		}),
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required()
		.messages({
			'string.empty': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			}),
			'any.required': t.get('base.common.thingRequired', {
				thing: t.get('base.common.email')
			})
		})
});
