/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export enum Collections {
  Accessibility = 'accessibility',
  Cities = 'cities',
  CongregationMeta = 'congregationMeta',
  Congregations = 'congregations',
  Countries = 'countries',
  Fit = 'fit',
  Health = 'health',
  Pages = 'pages',
  Registration = 'registration',
  Security = 'security',
  Services = 'services',
  States = 'states',
  Users = 'users'
}

export enum DenominationOptions {
  'conservative' = 'conservative',
  'humanist' = 'humanist',
  'multiDenominational' = 'multiDenominational',
  'orthodox' = 'orthodox',
  'other' = 'other',
  'postDenominational' = 'postDenominational',
  'reconstructionist' = 'reconstructionist',
  'reform' = 'reform',
  'renewal' = 'renewal',
  'unaffiliated' = 'unaffiliated'
}

export enum FitFlagOptions {
  'no' = 'no',
  'yes' = 'yes',
  'yesBima' = 'yesBima'
}
export enum HealthProtocolOptions {
  'maskingRecommended' = 'maskingRecommended',
  'maskingRequired' = 'maskingRequired',
  'noGuidelines' = 'noGuidelines',
  'other' = 'other'
}

export enum MetaDenominationOptions {
  'conservative' = 'conservative',
  'humanist' = 'humanist',
  'multiDenominational' = 'multiDenominational',
  'orthodox' = 'orthodox',
  'other' = 'other',
  'postDenominational' = 'postDenominational',
  'reconstructionist' = 'reconstructionist',
  'reform' = 'reform',
  'renewal' = 'renewal',
  'unaffiliated' = 'unaffiliated'
}

export enum PagesLangOptions {
  'de' = 'de',
  'en' = 'en',
  'es' = 'es',
  'fr' = 'fr',
  'he' = 'he'
}

// Record types for each collection

export enum RegistrationRegistrationTypeOptions {
  'fixedPrice' = 'fixedPrice',
  'free' = 'free',
  'other' = 'other',
  'slidingScale' = 'slidingScale',
  'suggestedDonation' = 'suggestedDonation'
}

export enum UsersLangOptions {
  'en' = 'en',
  'es' = 'es',
  'fr' = 'fr',
  'he' = 'he'
}

export type AccessibilityRecord = {
  congregation: RecordIdString;
  inPerson_adaAll?: boolean;
  inPerson_adaSome?: boolean;
  inPerson_asl?: boolean;
  inPerson_eva?: boolean;
  online_asl?: boolean;
  online_automatedCaptions?: boolean;
  online_liveCaptions?: boolean;
  other?: boolean;
  otherText?: string;
};
// Response types include system fields and match responses from the PocketBase API
export type AccessibilityResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<AccessibilityRecord>;

export type AuthSystemFields<T = never> = BaseSystemFields<T> & {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
};
// System fields
export type BaseSystemFields<T = never> = {
  collectionId: string;
  collectionName: Collections;
  created: IsoDateString;
  expand?: T;
  id: RecordIdString;
  updated: IsoDateString;
};

export type CitiesRecord = {
  country?: RecordIdString;
  latitude?: number;
  longitude?: number;
  name?: string;
  state?: RecordIdString;
};

export type CitiesResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<CitiesRecord>;
export type CollectionRecords = {
  accessibility: AccessibilityRecord;
  cities: CitiesRecord;
  congregationMeta: CongregationMetaRecord;
  congregations: CongregationsRecord;
  countries: CountriesRecord;
  fit: FitRecord;
  health: HealthRecord;
  pages: PagesRecord;
  registration: RegistrationRecord;
  security: SecurityRecord;
  services: ServicesRecord;
  states: StatesRecord;
  users: UsersRecord;
};

export type CollectionResponses = {
  accessibility: AccessibilityResponse;
  cities: CitiesResponse;
  congregationMeta: CongregationMetaResponse;
  congregations: CongregationsResponse;
  countries: CountriesResponse;
  fit: FitResponse;
  health: HealthResponse;
  pages: PagesResponse;
  registration: RegistrationResponse;
  security: SecurityResponse;
  services: ServicesResponse;
  states: StatesResponse;
  users: UsersResponse;
};
export type CongregationMetaRecord<
  Taccessibility = unknown,
  Tfit = unknown,
  Thealth = unknown,
  Tlocation = unknown,
  Tregistration = unknown,
  Tsecurity = unknown,
  Tservices = unknown
> = {
  accessibility?: null | Taccessibility;
  clergy?: string;
  contactEmail?: string;
  contactName?: string;
  contactUrl?: string;
  denomination?: CongregationMetaDenominationOptions;
  fit?: null | Tfit;
  flavor?: string;
  health?: null | Thealth;
  location?: null | Tlocation;
  name?: string;
  notes?: string;
  owner?: RecordIdString;
  registration?: null | Tregistration;
  security?: null | Tsecurity;
  services?: null | Tservices;
  visible?: boolean;
};

export type CongregationMetaResponse<
  Taccessibility = unknown,
  Tfit = unknown,
  Thealth = unknown,
  Tlocation = unknown,
  Tregistration = unknown,
  Tsecurity = unknown,
  Tservices = unknown,
  Texpand = unknown
> = BaseSystemFields<Texpand> &
  Required<CongregationMetaRecord<Taccessibility, Tfit, Thealth, Tlocation, Tregistration, Tsecurity, Tservices>>;
export type CongregationsRecord = {
  city?: RecordIdString;
  clergy?: string;
  contactEmail?: string;
  contactName?: string;
  contactUrl?: string;
  country?: RecordIdString;
  denomination?: CongregationsDenominationOptions;
  flavor?: string;
  name?: string;
  notes?: string;
  state?: RecordIdString;
  visible?: boolean;
};

export type CongregationsResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<CongregationsRecord>;
export type CountriesRecord = {
  code?: string;
  flag?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
};

export type CountriesResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<CountriesRecord>;

export type FitRecord = {
  clergyMember?: boolean;
  congregation: RecordIdString;
  flag?: FitFlagOptions;
  multipleClergyMembers?: boolean;
  other?: boolean;
  otherText?: string;
  publicStatement?: boolean;
};

export type FitResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<FitRecord>;

export type HealthRecord = {
  congregation: RecordIdString;
  otherText?: string;
  protocol?: HealthProtocolOptions;
};
export type HealthResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<HealthRecord>;

export type HTMLString = string;
// Alias types for improved usability
export type IsoDateString = string;
export type PagesRecord = {
  content?: HTMLString;
  description?: string;
  lang: PagesLangOptions;
  sisters?: RecordIdString[];
  slug: string;
  title: string;
};
export type PagesResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<PagesRecord>;
export type RecordIdString = string;
export type RegistrationRecord = {
  congregation: RecordIdString;
  email?: string;
  otherText?: string;
  registrationType?: RegistrationRegistrationTypeOptions;
  url?: string;
};
export type RegistrationResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<RegistrationRecord>;
export type SecurityRecord = {
  clergyArmed?: boolean;
  congregantsArmed?: boolean;
  congregation?: RecordIdString;
  localPolice?: boolean;
  noFirearms?: boolean;
  other?: boolean;
  otherText?: string;
  privateSecurityArmed?: boolean;
  privateSecurityUnarmed?: boolean;
};
export type SecurityResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<SecurityRecord>;
export type ServicesRecord = {
  congregation: RecordIdString;
  hybrid?: boolean;
  inPerson?: boolean;
  offsite?: boolean;
  onlineOnly?: boolean;
  other?: boolean;
  otherText?: string;
};
export type ServicesResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<ServicesRecord>;
export type StatesRecord = {
  code?: string;
  country?: RecordIdString;
  latitude?: number;
  longitude?: number;
  name?: string;
};
export type StatesResponse<Texpand = unknown> = BaseSystemFields<Texpand> & Required<StatesRecord>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type TypedPocketBase = PocketBase & {
  collection(idOrName: 'accessibility'): RecordService<AccessibilityResponse>;
  collection(idOrName: 'cities'): RecordService<CitiesResponse>;
  collection(idOrName: 'congregationMeta'): RecordService<CongregationMetaResponse>;
  collection(idOrName: 'congregations'): RecordService<CongregationsResponse>;
  collection(idOrName: 'countries'): RecordService<CountriesResponse>;
  collection(idOrName: 'fit'): RecordService<FitResponse>;
  collection(idOrName: 'health'): RecordService<HealthResponse>;
  collection(idOrName: 'pages'): RecordService<PagesResponse>;
  collection(idOrName: 'registration'): RecordService<RegistrationResponse>;
  collection(idOrName: 'security'): RecordService<SecurityResponse>;
  collection(idOrName: 'services'): RecordService<ServicesResponse>;
  collection(idOrName: 'states'): RecordService<StatesResponse>;
  collection(idOrName: 'users'): RecordService<UsersResponse>;
};

export type UsersRecord = {
  admin?: boolean;
  congregation?: RecordIdString;
  lang?: UsersLangOptions;
  name?: string;
};

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type UsersResponse<Texpand = unknown> = AuthSystemFields<Texpand> & Required<UsersRecord>;
