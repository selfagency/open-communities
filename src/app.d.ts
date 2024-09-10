// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { CookieSerializeOptions } from 'cookie';
import type { SuperValidated } from 'sveltekit-superforms';
import { Logger } from 'tslog';

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
			api: ApiService;
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
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
