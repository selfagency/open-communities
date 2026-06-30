import { describe, it, expect } from 'vitest';
import { keysAlreadyConfigured, buildBearerAuth, buildEnvEntry, createCaptchaKeys } from './captcha.mjs';

describe('keysAlreadyConfigured', () => {
  it('true when both keys present', () => {
    expect(keysAlreadyConfigured('PUBLIC_CAPTCHA_SITE_KEY=x\nCAPTCHA_SITE_SECRET=y')).toBe(true);
  });

  it('false when missing SITE_KEY', () => {
    expect(keysAlreadyConfigured('CAPTCHA_SITE_SECRET=y')).toBe(false);
  });

  it('false when missing SECRET', () => {
    expect(keysAlreadyConfigured('PUBLIC_CAPTCHA_SITE_KEY=x')).toBe(false);
  });

  it('false on empty content', () => {
    expect(keysAlreadyConfigured('')).toBe(false);
  });
});

describe('buildBearerAuth', () => {
  it('encodes token+hash as base64 Bearer', () => {
    const auth = buildBearerAuth('t123', 'h456');
    expect(auth).toMatch(/^Bearer /);
    const decoded = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    expect(decoded).toEqual({ token: 't123', hash: 'h456' });
  });
});

describe('buildEnvEntry', () => {
  it('formats env vars with newlines', () => {
    const e = buildEnvEntry('site123', 'secret456');
    expect(e).toContain('PUBLIC_CAPTCHA_SITE_KEY="site123"');
    expect(e).toContain('CAPTCHA_SITE_SECRET="secret456"');
    expect(e.split('\n')).toHaveLength(5);
  });
});

describe('createCaptchaKeys', () => {
  it('succeeds: login -> apikey -> sitekey', async () => {
    const mockPost = async (path, body, auth) => {
      if (path === '/auth/login') return { ok: true, data: { session_token: 't', hashed_token: 'h' } };
      if (path === '/server/settings/apikeys') return { ok: true, data: { apiKey: 'ak123' } };
      if (path === '/server/keys') return { ok: true, data: { siteKey: 'sk', secretKey: 'secret' } };
      return { ok: false };
    };
    const r = await createCaptchaKeys('http://cap', 'admin', mockPost);
    expect(r).toMatchObject({ ok: true, siteKey: 'sk', secretKey: 'secret' });
  });

  it('fails on login rejected', async () => {
    const mockPost = async () => ({ ok: false, status: 401 });
    const r = await createCaptchaKeys('http://cap', 'admin', mockPost);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('login failed');
  });

  it('fails on api key creation rejected', async () => {
    const mockPost = async (path) => {
      if (path === '/auth/login') return { ok: true, data: { session_token: 't', hashed_token: 'h' } };
      return { ok: false, status: 403 };
    };
    const r = await createCaptchaKeys('http://cap', 'admin', mockPost);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('api key creation failed');
  });
});
