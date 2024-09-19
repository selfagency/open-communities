/* region imports */
import { z } from 'zod';

import { t } from '$lib/i18n';
// import { log } from '$lib/utils';

import type { CongregationMetaRecord } from '$lib/types';

import {
	accessibilitySchema as accessibility,
	fitSchema as fit,
	registrationSchema as registration,
	healthSchema as health,
	securitySchema as security,
	servicesSchema as services
} from './recordChildren';
/* endregion imports */

/* region types */
export type DefaultSchema = CongregationMetaRecord;
/* endregion types */

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

export const defaultSchema = z.object({
	id: z.string().optional(),
	clergy: z.string().refine((value) => !!value, {
		message: t.get('common.thingRequired', {
			thing: t.get('congregation.clergy.clergy')
		})
	}),
	contactEmail: z.preprocess(
		(val) => (val === '' ? undefined : val),
		z.string().email().optional()
	),
	contactName: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
	contactUrl: z.preprocess(
		(val) => (val === '' ? undefined : val),
		z.string().url().nullable().optional()
	),
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
	accessibility,
	fit,
	registration,
	health,
	security,
	services
});