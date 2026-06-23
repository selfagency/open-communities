import { describe, expect, it, vi } from 'vitest';

import { validateCaptcha } from '../../lib/server/utils';

// Mock dependencies
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_CAPTCHA_SITE_KEY: 'test-site-key',
    PUBLIC_CAPTCHA_ENDPOINT: 'http://localhost:3001'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    CAPTCHA_SITE_SECRET: 'test-secret'
  }
}));

vi.mock('$lib/paraglide/messages', () => ({
  m: { invalidCaptcha: () => 'Invalid captcha' }
}));

vi.mock('$lib/server/logger', () => ({
  log: { debug: () => {}, error: () => {} }
}));

describe('validateCaptcha', () => {
  it('throws when captcha env vars are not configured', async () => {
    // Temporarily clear the env vars for this test
    const mod = await import('$env/dynamic/public');
    const originalKey = mod.env.PUBLIC_CAPTCHA_SITE_KEY;
    mod.env.PUBLIC_CAPTCHA_SITE_KEY = '';

    await expect(validateCaptcha({ data: {}, valid: true } as any)).rejects.toThrow(
      'Captcha validation is not configured'
    );

    mod.env.PUBLIC_CAPTCHA_SITE_KEY = originalKey;
  });

  it('returns false when no captcha token is provided', async () => {
    const form = { data: {}, valid: true } as any;
    const result = await validateCaptcha(form);
    expect(result).toBe(false);
  });

  it('returns false when captcha verification API fails', async () => {
    // Mock fetch to return unsuccessful response
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: false }), {
        headers: { 'content-type': 'application/json' }
      });

    const form = { data: { captcha: 'some-token' }, valid: true } as any;
    const result = await validateCaptcha(form);
    expect(result).toBe(false);

    globalThis.fetch = originalFetch;
  });

  it('returns true when captcha verification succeeds', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ success: true }), {
        headers: { 'content-type': 'application/json' }
      });

    const form = { data: { captcha: 'valid-token' }, valid: true } as any;
    const result = await validateCaptcha(form);
    expect(result).toBe(true);

    globalThis.fetch = originalFetch;
  });
});
