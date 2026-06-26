declare module 'cookie' {
  export interface ParseOptions {
    decode?: (val: string) => string;
  }

  export interface StringifyOptions {
    encode?: (val: string) => string;
  }

  export interface SetCookie {
    domain?: string;
    encode?: (val: string) => string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    name: string;
    partitioned?: boolean;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'strict' | 'lax' | 'none';
    secure?: boolean;
    value: string;
  }

  export type SerializeOptions = StringifyOptions & Omit<SetCookie, 'name' | 'value'>;

  export function parseCookie(str: string, options?: ParseOptions): Record<string, string | undefined>;
  export function parseSetCookie(str: string, options?: ParseOptions): SetCookie;
  export function stringifyCookie(cookies: Record<string, string>, options?: StringifyOptions): string;
  export function stringifySetCookie(cookie: SetCookie, options?: StringifyOptions): string;

  // Legacy aliases (removed in v2)
  export function parse(str: string, options?: ParseOptions): Record<string, string | undefined>;
  export function serialize(name: string, value: string, options?: SerializeOptions): string;
}
