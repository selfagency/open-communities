/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Accommodations = "accommodations",
	Cities = "cities",
	CongregationMeta = "congregationMeta",
	Congregations = "congregations",
	Countries = "countries",
	Fit = "fit",
	Pages = "pages",
	Registration = "registration",
	Safety = "safety",
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

export type AccommodationsRecord = {
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
export type CongregationMetaRecord<Taccommodations = unknown, Tfit = unknown, Tlocation = unknown, Tregistration = unknown, Tsafety = unknown, Tservices = unknown> = {
	accommodations?: null | Taccommodations
	clergy?: string
	contactEmail?: string
	contactName?: string
	contactUrl?: string
	denomination?: CongregationMetaDenominationOptions
	fit?: null | Tfit
	flavor?: string
	location?: null | Tlocation
	name?: string
	notes?: string
	owner?: RecordIdString
	registration?: null | Tregistration
	safety?: null | Tsafety
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

export enum SafetyProtocolOptions {
	"maskingRequired" = "maskingRequired",
	"maskingRecommended" = "maskingRecommended",
	"noGuidelines" = "noGuidelines",
	"other" = "other",
}
export type SafetyRecord = {
	congregation: RecordIdString
	otherText?: string
	protocol?: SafetyProtocolOptions
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
export type AccommodationsResponse<Texpand = unknown> = Required<AccommodationsRecord> & BaseSystemFields<Texpand>
export type CitiesResponse<Texpand = unknown> = Required<CitiesRecord> & BaseSystemFields<Texpand>
export type CongregationMetaResponse<Taccommodations = unknown, Tfit = unknown, Tlocation = unknown, Tregistration = unknown, Tsafety = unknown, Tservices = unknown, Texpand = unknown> = Required<CongregationMetaRecord<Taccommodations, Tfit, Tlocation, Tregistration, Tsafety, Tservices>> & BaseSystemFields<Texpand>
export type CongregationsResponse<Texpand = unknown> = Required<CongregationsRecord> & BaseSystemFields<Texpand>
export type CountriesResponse<Texpand = unknown> = Required<CountriesRecord> & BaseSystemFields<Texpand>
export type FitResponse<Texpand = unknown> = Required<FitRecord> & BaseSystemFields<Texpand>
export type PagesResponse<Texpand = unknown> = Required<PagesRecord> & BaseSystemFields<Texpand>
export type RegistrationResponse<Texpand = unknown> = Required<RegistrationRecord> & BaseSystemFields<Texpand>
export type SafetyResponse<Texpand = unknown> = Required<SafetyRecord> & BaseSystemFields<Texpand>
export type ServicesResponse<Texpand = unknown> = Required<ServicesRecord> & BaseSystemFields<Texpand>
export type StatesResponse<Texpand = unknown> = Required<StatesRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	accommodations: AccommodationsRecord
	cities: CitiesRecord
	congregationMeta: CongregationMetaRecord
	congregations: CongregationsRecord
	countries: CountriesRecord
	fit: FitRecord
	pages: PagesRecord
	registration: RegistrationRecord
	safety: SafetyRecord
	services: ServicesRecord
	states: StatesRecord
	users: UsersRecord
}

export type CollectionResponses = {
	accommodations: AccommodationsResponse
	cities: CitiesResponse
	congregationMeta: CongregationMetaResponse
	congregations: CongregationsResponse
	countries: CountriesResponse
	fit: FitResponse
	pages: PagesResponse
	registration: RegistrationResponse
	safety: SafetyResponse
	services: ServicesResponse
	states: StatesResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'accommodations'): RecordService<AccommodationsResponse>
	collection(idOrName: 'cities'): RecordService<CitiesResponse>
	collection(idOrName: 'congregationMeta'): RecordService<CongregationMetaResponse>
	collection(idOrName: 'congregations'): RecordService<CongregationsResponse>
	collection(idOrName: 'countries'): RecordService<CountriesResponse>
	collection(idOrName: 'fit'): RecordService<FitResponse>
	collection(idOrName: 'pages'): RecordService<PagesResponse>
	collection(idOrName: 'registration'): RecordService<RegistrationResponse>
	collection(idOrName: 'safety'): RecordService<SafetyResponse>
	collection(idOrName: 'services'): RecordService<ServicesResponse>
	collection(idOrName: 'states'): RecordService<StatesResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
