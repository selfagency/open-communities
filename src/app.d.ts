/* region imports */
import type { RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import type { SuperValidated } from 'sveltekit-superforms';
import { Logger } from 'tslog';
import type { $ZodType, output } from 'zod/v4/core';
import '@poppanator/sveltekit-svg/dist/svg';

import type { CongregationMetaRecord, PagesRecord, TypedPocketBase, UsersResponse } from '$lib/pocketbase.d';
import type { DefaultSchema, LoginSchema, TokenSchema, UserSchema } from '$lib/schemas';

/* endregion imports */

declare global {
  // biome-ignore lint/style/noNamespace: required by SvelteKit
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
      capture: (user: string | undefined, event: string, properties?: Record<string, unknown>) => Promise<void>;
      captureException: (error: unknown, user?: string, other?: Record<string, number | string>) => Promise<void>;
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
      startTimer?: number;
      traceId: string;
      track?: unknown;
      validate: <S extends $ZodType<Record<string, unknown>>>(
        request: Record<string, unknown> | RequestEvent,
        schema: S
      ) => Promise<SuperValidated<output<S>>>;
    }

    interface PageData {
      congregations?: CongregationMetaRecord[];
      content?: PagesRecord;
      default?: SuperValidated<DefaultSchema>;
      login?: SuperValidated<LoginSchema>;
      offline?: boolean;
      signup?: SuperValidated<UserSchema>;
      user?: UsersResponse | null;
      verify?: SuperValidated<TokenSchema>;
    }

    // interface PageState {}
    // interface Platform {}
  }
}
