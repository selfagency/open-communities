// @vitest-environment node

import { uid } from 'radashi';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Collections, CongregationMetaResponse, TypedPocketBase } from '$lib/pocketbase.d';

// mock the raw email template asset so mail.ts can call .replace() on it
vi.mock('$lib/assets/emailTemplate.html?raw', () => ({
  default: '<!doctype html><html><body>%MESSAGE%</body></html>'
}));

// Mock Mailgun env vars
vi.mock('$env/dynamic/private', () => ({
  env: {
    ADMIN_EMAIL: 'admin@test.test',
    MAILGUN_API_KEY: 'test-key',
    MAILGUN_DOMAIN: 'm.opencommunities.info'
  }
}));

// Capture the messages passed to transport.send so we can assert on them
interface CapturedMessage {
  content: { html: string; text: string };
  recipients: { address: string; name?: string }[];
  sender: { address: string; name?: string };
  subject: string;
}
const sentMessages: CapturedMessage[] = [];
vi.mock('@upyo/mailgun', () => ({
  MailgunTransport: class {
    send(message: CapturedMessage) {
      sentMessages.push(message);
      return Promise.resolve({ messageId: 'mock', successful: true });
    }
  }
}));

import { adminMail, transactionalMail } from '$lib/server/mail';

describe('src/lib/server/mail', () => {
  beforeEach(() => {
    sentMessages.length = 0;
  });

  it('sends transactional email via Mailgun', async () => {
    const txSubject = `TxSubject-${uid(8)}`;

    const payload = {
      email: 'user@example.test',
      message: 'Hello world',
      name: 'Test',
      subject: txSubject
    };

    const result = await transactionalMail(payload);
    expect(result).toEqual({ ok: true });

    expect(sentMessages).toHaveLength(1);
    const [sent] = sentMessages;
    expect(sent.subject).toBe(txSubject);
    expect(sent.recipients).toEqual([{ address: 'user@example.test', name: 'Test' }]);
    expect(sent.sender).toEqual({ address: 'no-reply@m.opencommunities.info', name: 'Open Communities' });
    expect(sent.content.text).toBe('Hello world');
    expect(sent.content.html).toContain('Hello world');
  });

  it('sends admin email with listing appended when record present', async () => {
    const fakeApi = {
      collection: (name: string) => {
        if (name === 'congregationMeta') {
          return {
            // biome-ignore lint/suspicious/useAwait: required by SvelteKit type signature
            getOne: async (id: string) => {
              const now = new Date().toISOString();
              const resp = {
                accessibility: null,
                clergy: '',
                collectionId: 'cong_meta_col',
                // use string for collectionName to avoid complex enum typing in test
                collectionName: 'CongregationMeta' as Collections,
                contactEmail: '',
                contactName: '',
                contactUrl: '',
                created: now,
                expand: undefined,
                fit: null,
                flavor: '',
                health: null,
                id,
                location: null,
                name: 'Congregation Name',
                notes: '',
                owner: '',
                registration: null,
                security: null,
                services: null,
                updated: now,
                visible: true
              } as unknown as CongregationMetaResponse;
              return resp;
            }
          };
        }
        // fallback minimal shape
        return { getOne: async () => ({}) as unknown };
      }
    } as unknown as TypedPocketBase;

    const adminSubject = `AdminSubject-${uid(8)}`;

    const payload = {
      email: 'from@example.test',
      message: 'Please review',
      name: 'Sender',
      record: 'abc',
      subject: adminSubject
    };

    await adminMail(payload, fakeApi);

    expect(sentMessages).toHaveLength(1);
    const [sent] = sentMessages;
    expect(sent.subject).toBe(adminSubject);
    expect(sent.recipients).toEqual([{ address: 'admin@test.test', name: 'Open Communities Admin' }]);
    expect(sent.sender).toEqual({ address: 'from@example.test', name: 'Sender via Open Communities' });
    expect(sent.content.text).toContain('Please review');
    expect(sent.content.text).toContain('Listing: Congregation Name');
    expect(sent.content.text).toContain('https://opencommunities.info/edit?id=abc');
  });
});
