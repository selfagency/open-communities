/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Accommodations = "accommodations",
	Congregations = "congregations",
	Fit = "fit",
	Registration = "registration",
	Safety = "safety",
	Services = "services",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AccommodationsRecord = {
	congregation?: RecordIdString
	hybrid_automatedCaptions?: boolean
	hybrid_liveCaptions?: boolean
	inPerson_adaAll?: boolean
	inPerson_adaSome?: boolean
	inPerson_asl?: boolean
	inPerson_eva?: boolean
	online_asl?: boolean
	online_automatedCaptions?: boolean
	online_liveCaptions?: boolean
}

export type CongregationsRecord = {
	city?: string
	clergy?: string
	contactEmail?: string
	contactUrl?: string
	country?: string
	description?: string
	flavor?: string
	name?: string
	notes?: string
	state?: string
}

export enum FitFlagOptions {
	"no" = "no",
	"yes" = "yes",
	"yesBima" = "yesBima",
}
export type FitRecord = {
	clergyMember?: boolean
	congregation?: RecordIdString
	flag?: FitFlagOptions
	multipleClergyMembers?: boolean
	other?: boolean
	otherText?: string
	publicStatement?: boolean
}

export enum RegistrationRegistrationTypeOptions {
	"fixedPrice" = "fixedPrice",
	"slidingScale" = "slidingScale",
	"suggestedDonation" = "suggestedDonation",
	"other" = "other",
}
export type RegistrationRecord = {
	congregation?: RecordIdString
	email?: string
	otherText?: string
	registrationType?: RegistrationRegistrationTypeOptions
	url?: string
}

export type SafetyRecord = {
	maskingRecommended?: boolean
	maskingRequired?: boolean
	noGuidelines?: boolean
	other?: boolean
	otherText?: string
}

export type ServicesRecord = {
	congregation?: RecordIdString
	hybrid?: boolean
	inPerson?: boolean
	offsite?: boolean
	onlineOnly?: boolean
}

export type UsersRecord = {
	congregation?: RecordIdString
	name?: string
}

// Response types include system fields and match responses from the PocketBase API
export type AccommodationsResponse<Texpand = unknown> = Required<AccommodationsRecord> & BaseSystemFields<Texpand>
export type CongregationsResponse<Texpand = unknown> = Required<CongregationsRecord> & BaseSystemFields<Texpand>
export type FitResponse<Texpand = unknown> = Required<FitRecord> & BaseSystemFields<Texpand>
export type RegistrationResponse<Texpand = unknown> = Required<RegistrationRecord> & BaseSystemFields<Texpand>
export type SafetyResponse<Texpand = unknown> = Required<SafetyRecord> & BaseSystemFields<Texpand>
export type ServicesResponse<Texpand = unknown> = Required<ServicesRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	accommodations: AccommodationsRecord
	congregations: CongregationsRecord
	fit: FitRecord
	registration: RegistrationRecord
	safety: SafetyRecord
	services: ServicesRecord
	users: UsersRecord
}

export type CollectionResponses = {
	accommodations: AccommodationsResponse
	congregations: CongregationsResponse
	fit: FitResponse
	registration: RegistrationResponse
	safety: SafetyResponse
	services: ServicesResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'accommodations'): RecordService<AccommodationsResponse>
	collection(idOrName: 'congregations'): RecordService<CongregationsResponse>
	collection(idOrName: 'fit'): RecordService<FitResponse>
	collection(idOrName: 'registration'): RecordService<RegistrationResponse>
	collection(idOrName: 'safety'): RecordService<SafetyResponse>
	collection(idOrName: 'services'): RecordService<ServicesResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
