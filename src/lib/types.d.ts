/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Accessibility = "accessibility",
	Cities = "cities",
	CongregationMeta = "congregationMeta",
	Congregations = "congregations",
	Countries = "countries",
	Fit = "fit",
	Health = "health",
	Pages = "pages",
	Registration = "registration",
	Security = "security",
	Services = "services",
	States = "states",
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

export type AccessibilityRecord = {
	congregation: RecordIdString
	inPerson_adaAll?: boolean
	inPerson_adaSome?: boolean
	inPerson_asl?: boolean
	inPerson_eva?: boolean
	online_asl?: boolean
	online_automatedCaptions?: boolean
	online_liveCaptions?: boolean
	other?: boolean
	otherText?: string
}

export type CitiesRecord = {
	country?: RecordIdString
	latitude?: number
	longitude?: number
	name?: string
	state?: RecordIdString
}

export enum CongregationMetaDenominationOptions {
	"reform" = "reform",
	"conservative" = "conservative",
	"orthodox" = "orthodox",
	"reconstructionist" = "reconstructionist",
	"renewal" = "renewal",
	"unaffiliated" = "unaffiliated",
	"postDenominational" = "postDenominational",
	"multiDenominational" = "multiDenominational",
	"humanist" = "humanist",
	"other" = "other",
}
export type CongregationMetaRecord<Taccessibility = unknown, Tfit = unknown, Thealth = unknown, Tlocation = unknown, Tregistration = unknown, Tsecurity = unknown, Tservices = unknown> = {
	accessibility?: null | Taccessibility
	clergy?: string
	contactEmail?: string
	contactName?: string
	contactUrl?: string
	denomination?: CongregationMetaDenominationOptions
	fit?: null | Tfit
	flavor?: string
	health?: null | Thealth
	location?: null | Tlocation
	name?: string
	notes?: string
	owner?: RecordIdString
	registration?: null | Tregistration
	security?: null | Tsecurity
	services?: null | Tservices
	visible?: boolean
}

export enum CongregationsDenominationOptions {
	"reform" = "reform",
	"conservative" = "conservative",
	"orthodox" = "orthodox",
	"reconstructionist" = "reconstructionist",
	"renewal" = "renewal",
	"unaffiliated" = "unaffiliated",
	"postDenominational" = "postDenominational",
	"multiDenominational" = "multiDenominational",
	"humanist" = "humanist",
	"other" = "other",
}
export type CongregationsRecord = {
	city?: RecordIdString
	clergy?: string
	contactEmail?: string
	contactName?: string
	contactUrl?: string
	country?: RecordIdString
	denomination?: CongregationsDenominationOptions
	flavor?: string
	name?: string
	notes?: string
	state?: RecordIdString
	visible?: boolean
}

export type CountriesRecord = {
	code?: string
	flag?: string
	latitude?: number
	longitude?: number
	name?: string
}

export enum FitFlagOptions {
	"no" = "no",
	"yes" = "yes",
	"yesBima" = "yesBima",
}
export type FitRecord = {
	clergyMember?: boolean
	congregation: RecordIdString
	flag?: FitFlagOptions
	multipleClergyMembers?: boolean
	other?: boolean
	otherText?: string
	publicStatement?: boolean
}

export enum HealthProtocolOptions {
	"maskingRequired" = "maskingRequired",
	"maskingRecommended" = "maskingRecommended",
	"noGuidelines" = "noGuidelines",
	"other" = "other",
}
export type HealthRecord = {
	congregation: RecordIdString
	otherText?: string
	protocol?: HealthProtocolOptions
}

export enum PagesLangOptions {
	"en" = "en",
	"de" = "de",
	"es" = "es",
	"fr" = "fr",
	"he" = "he",
}
export type PagesRecord = {
	content?: HTMLString
	description?: string
	lang: PagesLangOptions
	sisters?: RecordIdString[]
	slug: string
	title: string
}

export enum RegistrationRegistrationTypeOptions {
	"free" = "free",
	"fixedPrice" = "fixedPrice",
	"slidingScale" = "slidingScale",
	"suggestedDonation" = "suggestedDonation",
	"other" = "other",
}
export type RegistrationRecord = {
	congregation: RecordIdString
	email?: string
	otherText?: string
	registrationType?: RegistrationRegistrationTypeOptions
	url?: string
}

export type SecurityRecord = {
	clergyArmed?: boolean
	congregantsArmed?: boolean
	congregation?: RecordIdString
	localPolice?: boolean
	noFirearms?: boolean
	other?: boolean
	otherText?: string
	privateSecurityArmed?: boolean
	privateSecurityUnarmed?: boolean
}

export type ServicesRecord = {
	congregation: RecordIdString
	hybrid?: boolean
	inPerson?: boolean
	offsite?: boolean
	onlineOnly?: boolean
	other?: boolean
	otherText?: string
}

export type StatesRecord = {
	code?: string
	country?: RecordIdString
	latitude?: number
	longitude?: number
	name?: string
}

export enum UsersLangOptions {
	"en" = "en",
	"es" = "es",
	"fr" = "fr",
	"he" = "he",
}
export type UsersRecord = {
	admin?: boolean
	congregation?: RecordIdString
	lang?: UsersLangOptions
	name?: string
}

// Response types include system fields and match responses from the PocketBase API
export type AccessibilityResponse<Texpand = unknown> = Required<AccessibilityRecord> & BaseSystemFields<Texpand>
export type CitiesResponse<Texpand = unknown> = Required<CitiesRecord> & BaseSystemFields<Texpand>
export type CongregationMetaResponse<Taccessibility = unknown, Tfit = unknown, Thealth = unknown, Tlocation = unknown, Tregistration = unknown, Tsecurity = unknown, Tservices = unknown, Texpand = unknown> = Required<CongregationMetaRecord<Taccessibility, Tfit, Thealth, Tlocation, Tregistration, Tsecurity, Tservices>> & BaseSystemFields<Texpand>
export type CongregationsResponse<Texpand = unknown> = Required<CongregationsRecord> & BaseSystemFields<Texpand>
export type CountriesResponse<Texpand = unknown> = Required<CountriesRecord> & BaseSystemFields<Texpand>
export type FitResponse<Texpand = unknown> = Required<FitRecord> & BaseSystemFields<Texpand>
export type HealthResponse<Texpand = unknown> = Required<HealthRecord> & BaseSystemFields<Texpand>
export type PagesResponse<Texpand = unknown> = Required<PagesRecord> & BaseSystemFields<Texpand>
export type RegistrationResponse<Texpand = unknown> = Required<RegistrationRecord> & BaseSystemFields<Texpand>
export type SecurityResponse<Texpand = unknown> = Required<SecurityRecord> & BaseSystemFields<Texpand>
export type ServicesResponse<Texpand = unknown> = Required<ServicesRecord> & BaseSystemFields<Texpand>
export type StatesResponse<Texpand = unknown> = Required<StatesRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	accessibility: AccessibilityRecord
	cities: CitiesRecord
	congregationMeta: CongregationMetaRecord
	congregations: CongregationsRecord
	countries: CountriesRecord
	fit: FitRecord
	health: HealthRecord
	pages: PagesRecord
	registration: RegistrationRecord
	security: SecurityRecord
	services: ServicesRecord
	states: StatesRecord
	users: UsersRecord
}

export type CollectionResponses = {
	accessibility: AccessibilityResponse
	cities: CitiesResponse
	congregationMeta: CongregationMetaResponse
	congregations: CongregationsResponse
	countries: CountriesResponse
	fit: FitResponse
	health: HealthResponse
	pages: PagesResponse
	registration: RegistrationResponse
	security: SecurityResponse
	services: ServicesResponse
	states: StatesResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'accessibility'): RecordService<AccessibilityResponse>
	collection(idOrName: 'cities'): RecordService<CitiesResponse>
	collection(idOrName: 'congregationMeta'): RecordService<CongregationMetaResponse>
	collection(idOrName: 'congregations'): RecordService<CongregationsResponse>
	collection(idOrName: 'countries'): RecordService<CountriesResponse>
	collection(idOrName: 'fit'): RecordService<FitResponse>
	collection(idOrName: 'health'): RecordService<HealthResponse>
	collection(idOrName: 'pages'): RecordService<PagesResponse>
	collection(idOrName: 'registration'): RecordService<RegistrationResponse>
	collection(idOrName: 'security'): RecordService<SecurityResponse>
	collection(idOrName: 'services'): RecordService<ServicesResponse>
	collection(idOrName: 'states'): RecordService<StatesResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
