// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock the raw email template asset so mail.ts can call .replace() on it
vi.mock('$lib/assets/emailTemplate.html?raw', () => ({
  default: '<!doctype html><html><body>%MESSAGE%</body></html>'
}));

// Mock env WITHOUT MAILGUN_API_KEY so mail.ts selects the SMTP (Mailpit) path.
vi.mock('$env/dynamic/private', () => ({
  env: {
    ADMIN_EMAIL: 'admin@test.test',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025'
  }
}));

// Capture the messages passed to the SMTP transport so we can assert on them.
interface CapturedMessage {
  content: { html: string; text: string };
  recipients: { address: string; name?: string }[];
  sender: { address: string; name?: string };
  subject: string;
}
const sentMessages: CapturedMessage[] = [];
vi.mock('@upyo/smtp', () => ({
  SmtpTransport: class {
    send(message: CapturedMessage) {
      sentMessages.push(message);
      return Promise.resolve({ messageId: 'mock', successful: true });
    }
  }
}));

import { transactionalMail } from '$lib/server/mail';

describe('src/lib/server/mail — SMTP fallback (no MAILGUN_API_KEY)', () => {
  beforeEach(() => {
    sentMessages.length = 0;
  });

  it('sends transactional email via SMTP when Mailgun key is absent', async () => {
    const result = await transactionalMail({
      email: 'user@example.test',
      message: 'Hello via SMTP',
      name: 'Test',
      subject: 'SmtpSubject'
    });

    expect(result).toEqual({ ok: true });
    expect(sentMessages).toHaveLength(1);
    const [sent] = sentMessages;
    expect(sent.subject).toBe('SmtpSubject');
    expect(sent.recipients).toEqual([{ address: 'user@example.test', name: 'Test' }]);
    expect(sent.sender).toEqual({ address: 'no-reply@m.opencommunities.info', name: 'Open Communities' });
    expect(sent.content.text).toBe('Hello via SMTP');
    expect(sent.content.html).toContain('Hello via SMTP');
  });
});
