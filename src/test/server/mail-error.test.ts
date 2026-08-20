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

// Mock @upyo/mailgun to always throw for error-path testing
vi.mock('@upyo/mailgun', () => ({
  MailgunTransport: class {
    send() {
      return Promise.reject(new Error('SMTP connection refused'));
    }
  }
}));

// Mock Mailgun env vars
vi.mock('$env/dynamic/private', () => ({
  env: {
    ADMIN_EMAIL: 'admin@test.test',
    MAILGUN_API_KEY: 'test-key',
    MAILGUN_DOMAIN: 'm.opencommunities.info'
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
