/* region imports */
import type { CookieSerializeOptions } from 'cookie';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { ObjectSchema } from 'zod';

import '@poppanator/sveltekit-svg/dist/svg';
import { Logger } from 'tslog';

import type { DefaultSchema, LoginSchema, UserSchema } from '$lib/schemas';
import type { CongregationMetaRecord, TypedPocketBase } from '$lib/types';

/* endregion imports */

declare global {
	namespace App {
		interface Error {
			code?: string;
			errorId?: string;
			message?: string;
			stack?: string;
			status?: number;
		}

		interface Locals {
			api: TypedPocketBase;
			auth: string;
			cookieOpts: CookieSerializeOptions & { path: string };
			error?: string;
			errorId?: string;
			errorStackTrace?: string;
			i18n: {
				locale: string;
				route: string;
			};
			log: Logger<{ main: boolean; sub: boolean }>;
			message?: unknown;
			session: string;
			startTimer?: number;
			track?: unknown;
			validate: (
				request: unknown,
				schema?: unknown
			) => Promise<SuperValidated<Infer<ObjectSchema<DefaultSchema | LoginSchema | UserSchema>>>>;
		}

		interface PageData {
			congregations: CongregationMetaRecord[];
			form: SuperValidated<Infer<ObjectSchema<DefaultSchema | LoginSchema | UserSchema>>>;
		}

		// interface PageState {}
		// interface Platform {}
	}
}

export {};
