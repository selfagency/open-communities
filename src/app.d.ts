/* region imports */
import type { SerializeOptions } from 'cookie';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { ObjectSchema } from 'zod';

import '@poppanator/sveltekit-svg/dist/svg';
import { Logger } from 'tslog';

import type { CongregationMetaRecord, TypedPocketBase } from '$lib/pocketbase.d';
import type { DefaultSchema, LoginSchema, TokenSchema, UserSchema } from '$lib/schemas';

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
      cookieOpts: SerializeOptions & { path: string };
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
      ) => Promise<SuperValidated<Infer<ObjectSchema<DefaultSchema | LoginSchema | TokenSchema | UserSchema>>>>;
    }

    interface PageData {
      congregations?: CongregationMetaRecord[];
      default?: SuperValidated<DefaultSchema>;
      login?: SuperValidated<LoginSchema>;
      signup?: SuperValidated<UserSchema>;
      verify?: SuperValidated<TokenSchema>;
    }

    // interface PageState {}
    // interface Platform {}
  }
}

export {};
