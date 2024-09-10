/* region imports */
import type { CookieSerializeOptions } from 'cookie';
import type { SuperValidated } from 'sveltekit-superforms';

import '@poppanator/sveltekit-svg/dist/svg';
import { Logger } from 'tslog';

import type { TypedPocketBase, CongregationMetaRecord } from '$lib/types';
/* endregion imports */

declare global {
	namespace App {
		interface Error {
			message?: string;
			status?: number;
			stack?: string;
			code?: string;
			errorId?: string;
		}

		interface Locals {
			api: TypedPocketBase;
			auth: string;
			cookieOpts: CookieSerializeOptions & { path: string };
			startTimer?: number;
			error?: string;
			errorId?: string;
			errorStackTrace?: string;
			log: Logger<{ main: boolean; sub: boolean }>;
			message?: unknown;
			session: string;
			track?: unknown;
			validate: (
				request: unknown,
				schema?: unknown
			) => Promise<SuperValidated<Record<string, unknown>, unknown, Record<string, unknown>>>;
		}

		interface PageData {
			congregations: CongregationMetaRecord[];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
