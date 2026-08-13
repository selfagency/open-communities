/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase';
import type { RecordService } from 'pocketbase';

export const Collections = {
  Accessibility: 'accessibility',
  Authorigins: '_authOrigins',
  Cities: 'cities',
  CongregationMeta: 'congregationMeta',
  Congregations: 'congregations',
  Countries: 'countries',
  Externalauths: '_externalAuths',
  Fit: 'fit',
  Health: 'health',
  Mfas: '_mfas',
  Otps: '_otps',
  Pages: 'pages',
  Registration: 'registration',
  Security: 'security',
  Services: 'services',
  States: 'states',
  Superusers: '_superusers',
  Translations: 'translations',
  Users: 'users'
} as const;
export type Collections = (typeof Collections)[keyof typeof Collections];

// Alias types for improved usability
export type IsoDateString = string;
export type IsoAutoDateString = string & { readonly autodate: unique symbol };
export type RecordIdString = string;
export type FileNameString = string & { readonly filename: unique symbol };
export type HTMLString = string;

type ExpandType<T> = unknown extends T ? (T extends unknown ? { expand?: unknown } : { expand: T }) : { expand: T };

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString;
  collectionId: string;
  collectionName: Collections;
} & ExpandType<T>;

export type AuthSystemFields<T = unknown> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export interface AuthoriginsRecord {
  collectionRef: string;
  created: IsoAutoDateString;
  fingerprint: string;
  id: string;
  recordRef: string;
  updated: IsoAutoDateString;
}

export interface ExternalauthsRecord {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  provider: string;
  providerId: string;
  recordRef: string;
  updated: IsoAutoDateString;
}

export interface MfasRecord {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  method: string;
  recordRef: string;
  updated: IsoAutoDateString;
}

export interface OtpsRecord {
  collectionRef: string;
  created: IsoAutoDateString;
  id: string;
  password: string;
  recordRef: string;
  sentTo?: string;
  updated: IsoAutoDateString;
}

export interface SuperusersRecord {
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
}

export interface AccessibilityRecord {
  congregation: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  inPerson_adaAll?: boolean;
  inPerson_adaSome?: boolean;
  inPerson_asl?: boolean;
  inPerson_eva?: boolean;
  online_asl?: boolean;
  online_automatedCaptions?: boolean;
  online_liveCaptions?: boolean;
  other?: boolean;
  otherText?: string;
  updated: IsoAutoDateString;
}

export interface CitiesRecord {
  country?: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  state?: RecordIdString;
  updated: IsoAutoDateString;
}

export const CongregationMetaDenominationOptions = {
  conservative: 'conservative',
  humanist: 'humanist',
  multiDenominational: 'multiDenominational',
  orthodox: 'orthodox',
  other: 'other',
  postDenominational: 'postDenominational',
  reconstructionist: 'reconstructionist',
  reform: 'reform',
  renewal: 'renewal',
  unaffiliated: 'unaffiliated'
} as const;
export type CongregationMetaDenominationOptions =
  (typeof CongregationMetaDenominationOptions)[keyof typeof CongregationMetaDenominationOptions];
export interface CongregationMetaRecord<
  Taccessibility = unknown,
  Tfit = unknown,
  Thealth = unknown,
  Tlocation = unknown,
  Tregistration = unknown,
  Tsecurity = unknown,
  Tservices = unknown
> {
  accessibility?: null | Taccessibility;
  clergy?: string;
  contactEmail?: string;
  contactName?: string;
  contactUrl?: string;
  denomination?: CongregationMetaDenominationOptions;
  fit?: null | Tfit;
  flavor?: string;
  health?: null | Thealth;
  id: string;
  location?: null | Tlocation;
  name?: string;
  notes?: string;
  owner?: RecordIdString;
  registration?: null | Tregistration;
  security?: null | Tsecurity;
  services?: null | Tservices;
  visible?: boolean;
}

export const CongregationsDenominationOptions = {
  conservative: 'conservative',
  humanist: 'humanist',
  multiDenominational: 'multiDenominational',
  orthodox: 'orthodox',
  other: 'other',
  postDenominational: 'postDenominational',
  reconstructionist: 'reconstructionist',
  reform: 'reform',
  renewal: 'renewal',
  unaffiliated: 'unaffiliated'
} as const;
export type CongregationsDenominationOptions =
  (typeof CongregationsDenominationOptions)[keyof typeof CongregationsDenominationOptions];
export interface CongregationsRecord {
  city?: RecordIdString;
  clergy?: string;
  contactEmail?: string;
  contactName?: string;
  contactUrl?: string;
  country?: RecordIdString;
  created: IsoAutoDateString;
  denomination?: CongregationsDenominationOptions;
  flavor?: string;
  id: string;
  name?: string;
  notes?: string;
  state?: RecordIdString;
  updated: IsoAutoDateString;
  visible?: boolean;
}

export interface CountriesRecord {
  code?: string;
  created: IsoAutoDateString;
  flag?: string;
  id: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  updated: IsoAutoDateString;
}

export const FitFlagOptions = {
  no: 'no',
  yes: 'yes',
  yesBima: 'yesBima'
} as const;
export type FitFlagOptions = (typeof FitFlagOptions)[keyof typeof FitFlagOptions];
export interface FitRecord {
  clergyMember?: boolean;
  congregation: RecordIdString;
  created: IsoAutoDateString;
  flag?: FitFlagOptions;
  id: string;
  multipleClergyMembers?: boolean;
  other?: boolean;
  otherText?: string;
  publicStatement?: boolean;
  updated: IsoAutoDateString;
}

export const HealthProtocolOptions = {
  maskingRecommended: 'maskingRecommended',
  maskingRequired: 'maskingRequired',
  noGuidelines: 'noGuidelines',
  other: 'other'
} as const;
export type HealthProtocolOptions = (typeof HealthProtocolOptions)[keyof typeof HealthProtocolOptions];
export interface HealthRecord {
  congregation: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  otherText?: string;
  protocol?: HealthProtocolOptions;
  updated: IsoAutoDateString;
}

export const PagesLangOptions = {
  de: 'de',
  en: 'en',
  es: 'es',
  fr: 'fr',
  he: 'he'
} as const;
export type PagesLangOptions = (typeof PagesLangOptions)[keyof typeof PagesLangOptions];
export interface PagesRecord {
  content?: HTMLString;
  created: IsoAutoDateString;
  description?: string;
  id: string;
  lang: PagesLangOptions;
  published?: boolean;
  sisters?: RecordIdString[];
  slug: string;
  title: string;
  updated: IsoAutoDateString;
}

export const RegistrationRegistrationTypeOptions = {
  fixedPrice: 'fixedPrice',
  free: 'free',
  other: 'other',
  slidingScale: 'slidingScale',
  suggestedDonation: 'suggestedDonation'
} as const;
export type RegistrationRegistrationTypeOptions =
  (typeof RegistrationRegistrationTypeOptions)[keyof typeof RegistrationRegistrationTypeOptions];
export interface RegistrationRecord {
  congregation: RecordIdString;
  created: IsoAutoDateString;
  email?: string;
  id: string;
  otherText?: string;
  registrationType?: RegistrationRegistrationTypeOptions;
  updated: IsoAutoDateString;
  url?: string;
}

export interface SecurityRecord {
  clergyArmed?: boolean;
  congregantsArmed?: boolean;
  congregation?: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  localPolice?: boolean;
  noFirearms?: boolean;
  other?: boolean;
  otherText?: string;
  privateSecurityArmed?: boolean;
  privateSecurityUnarmed?: boolean;
  updated: IsoAutoDateString;
}

export interface ServicesRecord {
  congregation: RecordIdString;
  created: IsoAutoDateString;
  hybrid?: boolean;
  id: string;
  inPerson?: boolean;
  offsite?: boolean;
  onlineOnly?: boolean;
  other?: boolean;
  otherText?: string;
  updated: IsoAutoDateString;
}

export interface StatesRecord {
  code?: string;
  country?: RecordIdString;
  created: IsoAutoDateString;
  id: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  updated: IsoAutoDateString;
}

export const TranslationsLocaleOptions = {
  de: 'de',
  en: 'en',
  es: 'es',
  fr: 'fr',
  he: 'he',
  hu: 'hu',
  nl: 'nl',
  pl: 'pl',
  pt: 'pt',
  ru: 'ru',
  uk: 'uk'
} as const;
export type TranslationsLocaleOptions = (typeof TranslationsLocaleOptions)[keyof typeof TranslationsLocaleOptions];
export interface TranslationsRecord {
  created: IsoAutoDateString;
  id: string;
  key: string;
  locale: TranslationsLocaleOptions;
  updated: IsoAutoDateString;
  value: string;
}

export const UsersLangOptions = {
  de: 'de',
  en: 'en',
  es: 'es',
  fr: 'fr',
  he: 'he'
} as const;
export type UsersLangOptions = (typeof UsersLangOptions)[keyof typeof UsersLangOptions];
export interface UsersRecord {
  admin?: boolean;
  avatar?: FileNameString;
  congregation?: RecordIdString;
  created: IsoAutoDateString;
  email: string;
  emailVisibility?: boolean;
  id: string;
  lang?: UsersLangOptions;
  name?: string;
  notifications?: boolean;
  password: string;
  tokenKey: string;
  updated: IsoAutoDateString;
  verified?: boolean;
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>;
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>;
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>;
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>;
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>;
export type AccessibilityResponse<Texpand = unknown> = Required<AccessibilityRecord> & BaseSystemFields<Texpand>;
export type CitiesResponse<Texpand = unknown> = Required<CitiesRecord> & BaseSystemFields<Texpand>;
export type CongregationMetaResponse<
  Taccessibility = unknown,
  Tfit = unknown,
  Thealth = unknown,
  Tlocation = unknown,
  Tregistration = unknown,
  Tsecurity = unknown,
  Tservices = unknown,
  Texpand = unknown
> = Required<CongregationMetaRecord<Taccessibility, Tfit, Thealth, Tlocation, Tregistration, Tsecurity, Tservices>> &
  BaseSystemFields<Texpand>;
export type CongregationsResponse<Texpand = unknown> = Required<CongregationsRecord> & BaseSystemFields<Texpand>;
export type CountriesResponse<Texpand = unknown> = Required<CountriesRecord> & BaseSystemFields<Texpand>;
export type FitResponse<Texpand = unknown> = Required<FitRecord> & BaseSystemFields<Texpand>;
export type HealthResponse<Texpand = unknown> = Required<HealthRecord> & BaseSystemFields<Texpand>;
export type PagesResponse<Texpand = unknown> = Required<PagesRecord> & BaseSystemFields<Texpand>;
export type RegistrationResponse<Texpand = unknown> = Required<RegistrationRecord> & BaseSystemFields<Texpand>;
export type SecurityResponse<Texpand = unknown> = Required<SecurityRecord> & BaseSystemFields<Texpand>;
export type ServicesResponse<Texpand = unknown> = Required<ServicesRecord> & BaseSystemFields<Texpand>;
export type StatesResponse<Texpand = unknown> = Required<StatesRecord> & BaseSystemFields<Texpand>;
export type TranslationsResponse<Texpand = unknown> = Required<TranslationsRecord> & BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export interface CollectionRecords {
  _authOrigins: AuthoriginsRecord;
  _externalAuths: ExternalauthsRecord;
  _mfas: MfasRecord;
  _otps: OtpsRecord;
  _superusers: SuperusersRecord;
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
  translations: TranslationsRecord;
  users: UsersRecord;
}

export interface CollectionResponses {
  _authOrigins: AuthoriginsResponse;
  _externalAuths: ExternalauthsResponse;
  _mfas: MfasResponse;
  _otps: OtpsResponse;
  _superusers: SuperusersResponse;
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
  translations: TranslationsResponse;
  users: UsersResponse;
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
  {
    // Omit AutoDate fields
    [K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: // Convert FileNameString to File
    T[K] extends infer U
      ? U extends FileNameString | FileNameString[]
        ? // biome-ignore lint/suspicious/noExplicitAny: intentional noExplicitAny
          U extends any[]
          ? File[]
          : File
        : U
      : never;
  },
  'id'
>;

// Create type for Auth collections
export type CreateAuth<T> = {
  id?: RecordIdString;
  email: string;
  emailVisibility?: boolean;
  password: string;
  passwordConfirm: string;
  verified?: boolean;
} & ProcessCreateAndUpdateFields<T>;

// Create type for Base collections
export type CreateBase<T> = {
  id?: RecordIdString;
} & ProcessCreateAndUpdateFields<T>;

// Update type for Auth collections
export type UpdateAuth<T> = Partial<Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>> & {
  email?: string;
  emailVisibility?: boolean;
  oldPassword?: string;
  password?: string;
  passwordConfirm?: string;
  verified?: boolean;
};

// Update type for Base collections
export type UpdateBase<T> = Partial<Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>>;

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> = CollectionResponses[T] extends AuthSystemFields
  ? CreateAuth<CollectionRecords[T]>
  : CreateBase<CollectionRecords[T]>;

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> = CollectionResponses[T] extends AuthSystemFields
  ? UpdateAuth<CollectionRecords[T]>
  : UpdateBase<CollectionRecords[T]>;

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
  collection: <T extends keyof CollectionResponses>(idOrName: T) => RecordService<CollectionResponses[T]>;
} & PocketBase;
