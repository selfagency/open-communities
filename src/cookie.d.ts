declare module 'cookie' {
  export interface SerializeOptions {
    domain?: string;
    encode?: (val: string) => string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'strict' | 'lax' | 'none';
    secure?: boolean;
  }

  export interface ParseOptions {
    decode?: (val: string) => string;
    domain?: string;
  }

  export function serialize(name: string, value: string, options?: SerializeOptions): string;
  export function parse(cookieString: string, options?: ParseOptions): Record<string, string>;
}
