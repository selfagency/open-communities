declare module 'cookie' {
  export interface SerializeOptions {
    encode?: (val: string) => string;
    maxAge?: number;
    domain?: string;
    path?: string;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | 'strict' | 'lax' | 'none';
    priority?: 'low' | 'medium' | 'high';
  }

  export interface ParseOptions {
    decode?: (val: string) => string;
    domain?: string;
  }

  export function serialize(name: string, value: string, options?: SerializeOptions): string;
  export function parse(cookieString: string, options?: ParseOptions): Record<string, string>;
}
