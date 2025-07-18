/* region imports */
import * as z from 'zod';

import type { CongregationMetaRecord } from '$lib/pocketbase.d';
// import { log } from '$lib/utils';

import * as m from '$lib/paraglide/messages';

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
		message: m.thingRequired({ thing: '`id`' })
	})
});

export type DeleteSchema = z.infer<typeof deleteSchema>;

export const transferSchema = z.object({
	email: z.email().refine((value) => !!value, {
		message: m.thingRequired({ thing: m.email() })
	}),
	id: z.string().refine((value) => !!value, {
		message: m.thingRequired({ thing: '`id`' })
	}),
	owner: z.string().optional()
});

export type TransferSchema = z.infer<typeof transferSchema>;

export const defaultSchema = z.object({
	accessibility,
	captcha: z.string().optional(),
	clergy: z.string().refine((value) => !!value, {
		message: m.thingRequired({ thing: m.clergy.clergy() })
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
	fit,
	flavor: z.string().refine((value) => !!value, {
		message: m.thingRequired({ thing: m.flavor.flavor() })
	}),
	health,
	id: z.string().optional(),
	location: z.object({
		city: z.string().optional(),
		country: z.string().optional(),
		state: z.string().optional()
	}),
	name: z.string().refine((value) => !!value, {
		message: m.thingRequired({ thing: m.name() })
	}),
	notes: z.string().optional(),
	owner: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
	registration,
	security,
	services,
	visible: z.boolean()
});

export type DefaultSchema = CongregationMetaRecord;
