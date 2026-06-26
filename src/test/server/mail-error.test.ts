// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

// Mock email template
vi.mock('$lib/assets/emailTemplate.html?raw', () => ({
  default: '<!doctype html><html><body>%MESSAGE%</body></html>'
}));

// Mock $app/environment for dev flag
vi.mock('$app/environment', () => ({
  dev: false
}));

// Mock nodemailer to always throw for error-path testing
vi.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.reject(new Error('SMTP connection refused')),
    verify: () => Promise.reject(new Error('Verification failed'))
  })
}));

// Mock SMTP env vars
vi.mock('$env/dynamic/private', () => ({
  env: {
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_USER: 'test',
    SMTP_PASS: 'test',
    ADMIN_EMAIL: 'admin@test.test'
  }
}));

import { transactionalMail } from '$lib/server/mail';

/**
 * S-6 fix: transactionalMail returns {ok, error} instead of fire-and-forget.
 */
describe('transactionalMail error handling', () => {
  it('returns { ok: false, error } when SMTP fails', async () => {
    const result = await transactionalMail({
      email: 'user@test.com',
      message: 'Test message',
      name: 'Test User',
      subject: 'Test Subject'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTypeOf('string');
    }
  });

  it('returns the thrown error message', async () => {
    const result = await transactionalMail({
      email: 'user@test.com',
      message: 'Test message',
      name: 'Test User',
      subject: 'Test Subject'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('SMTP connection refused');
    }
  });
});
