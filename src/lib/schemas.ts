/* region imports */
import joi from 'joi';
import { isEmpty } from 'radashi';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';

import type {
	AccommodationsRecord,
	CongregationMetaRecord,
	FitRecord,
	LocalesRecord,
	RegistrationRecord,
	SafetyRecord,
	ServicesRecord,
	UsersRecord
} from '$lib/types';
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
const password = joi
	.string()
	.min(12)
	.max(64)
	.pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\da-zA-Z]).{12,64}$'));
/* endregion variables */

/* region methods */
const fitCheck: joi.CustomValidator = (value, helpers) => {
	if (
		!isEmpty(value) &&
		!value?.clergyMember &&
		!value?.multipleClergyMembers &&
		!value?.other &&
		!value?.publicStatement
	) {
		return helpers.message(t.get('common.required'));
	}
	return value;
};

const registrationCheck: joi.CustomValidator = (value, helpers) => {
	if (!isEmpty(value) && isEmpty(value?.email) && isEmpty(value?.url)) {
		return helpers.message(t.get('common.thingRequired', { thing: t.get('common.emailOrUrl') }));
	}

	return value;
};

const safetyCheck: joi.CustomValidator = (value, helpers) => {
	if (!isEmpty(value) && isEmpty(value?.protocol)) {
		return helpers.message(t.get('common.required'));
	}
	if (!isEmpty(value) && value?.protocol === 'other' && isEmpty(value?.otherText)) {
		return helpers.message(t.get('common.thingRequired', { thing: t.get('common.otherText') }));
	}
	return value;
};

const servicesCheck: joi.CustomValidator = (value, helpers) => {
	if (
		!isEmpty(value) &&
		!value?.hybrid &&
		!value?.inPerson &&
		!value?.offsite &&
		!value?.onlineOnly &&
		!value?.other
	) {
		return helpers.message(t.get('common.required'));
	}

	if (value?.other && isEmpty(value?.otherText)) {
		return helpers.message(t.get('common.thingRequired', { thing: t.get('common.otherText') }));
	}
	return value;
};
/* endregion methods */

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
	.custom(fitCheck, 'fitCheck');

const localeSchema = joi.object<LocalesRecord & { id: string }>({
	city: joi.string().required(),
	country: joi.string().required(),
	state: joi.string().required(),
	latitude: joi.number().required(),
	longitude: joi.number().required()
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
				'any.only': t.get('common.required')
			}),
		url: joi
			.string()
			.uri()
			.allow('')
			.messages({ 'string.uri': t.get('common.invalidUrl') })
	})
	.custom(registrationCheck, 'registrationCheck');

const safetySchema = joi
	.object<SafetyRecord & { id: string }>({
		id: joi.string(),
		protocol: joi
			.string()
			.valid('maskingRequired', 'maskingRecommended', 'noGuidelines', 'other')
			.required()
			.messages({
				'any.only': t.get('common.required')
			}),
		otherText: joi.string().allow('')
	})
	.custom(safetyCheck, 'safetyCheck');

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
	.custom(servicesCheck, 'servicesCheck');

export const defaultSchema = joi.object<CongregationMetaRecord & { id: string }>({
	id: joi.string(),
	clergy: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('congregation.clergy.clergy')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('congregation.clergy.clergy')
			})
		}),
	contactEmail: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('congregation.contactEmail.contactEmail')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('congregation.contactEmail.contactEmail')
			})
		}),
	contactName: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('congregation.contactName.contactName')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('congregation.contactName.contactName')
			})
		}),
	contactUrl: joi
		.string()
		.uri()
		.allow('')
		.messages({ 'string.uri': t.get('common.invalidUrl') }),
	flavor: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.required'),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('congregation.flavor.flavor')
			})
		}),
	name: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.name')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.name')
			})
		}),
	notes: joi.string().allow(''),
	visible: joi.boolean(),
	accommodations: accommodationsSchema,
	fit: fitSchema,
	locale: localeSchema,
	registration: registrationSchema,
	safety: safetySchema,
	services: servicesSchema
});

export const loginSchema = joi.object<LoginSchema>({
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.email')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.email')
			})
		}),
	password: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('auth.password')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('auth.password')
			})
		})
});

export const userSchema = joi.object<UserSchema>({
	id: joi.string(),
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.email')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.email')
			})
		}),
	congregation: joi.string(),
	name: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.name')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.name')
			})
		}),
	lang: joi.string().valid('en', 'es', 'fr', 'he').default('en'),
	password,
	oldPassword: joi.string(),
	passwordConfirm: joi.string().valid(joi.ref('password'))
});

export const tokenSchema = joi.object<TokenSchema>({
	token: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.token')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.token')
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
			'string.empty': t.get('common.thingRequired', {
				thing: '`id`'
			}),
			'any.required': t.get('common.thingRequired', {
				thing: '`id`'
			})
		})
});

export const transferSchema = joi.object({
	id: joi
		.string()
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: '`id`'
			}),
			'any.required': t.get('common.thingRequired', {
				thing: '`id`'
			})
		}),
	email: joi
		.string()
		.email({ tlds: { allow: false } })
		.required()
		.messages({
			'string.empty': t.get('common.thingRequired', {
				thing: t.get('common.email')
			}),
			'any.required': t.get('common.thingRequired', {
				thing: t.get('common.email')
			})
		})
});
