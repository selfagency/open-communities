import FormData from 'form-data';
import DOMPurify from 'isomorphic-dompurify';
import Mailgun from 'mailgun.js';
import { marked } from 'marked';
/* region imports */
import { env } from '$env/dynamic/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import type { TypedPocketBase } from '$lib/pocketbase.d';
import { log } from '$lib/server/logger';

/* endregion imports */

const { ADMIN_EMAIL, MAILGUN_API_KEY, MAILGUN_DOMAIN } = env;

// Derive the client type from the Mailgun class — the package does not export
// its IMailgunClient type from the root, and deep imports are blocked by its
// exports map.
type MailgunClient = ReturnType<InstanceType<typeof Mailgun>['client']>;

// Lazy singleton Mailgun client — created once on first use, reused for all subsequent sends.
let _client: MailgunClient | null = null;

/**
 * Sanitize a header value by stripping CR/LF characters and trimming whitespace.
 * Prevents SMTP header injection attacks (CVE-style via \r\n in user-controlled fields).
 */
function sanitizeHeader(value: string | undefined | null): string {
  return (value ?? '').replace(/[\r\n]/g, ' ').trim();
}

export interface AdminMailInput {
  email: string;
  message: string;
  name: string;
  record?: string;
  subject: string;
}

export interface TransactionalMailInput {
  email: string;
  message: string;
  name: string;
  subject: string;
}

export async function adminMail({ email, message, name, record, subject }: AdminMailInput, api: TypedPocketBase) {
  try {
    // Build message body (may augment with congregation link)
    let bodyText = message;
    let congregation: string | undefined;
    let congregationUrl: string | undefined;

    if (record && record.trim() !== '') {
      const congMeta = await api.collection('congregationMeta').getOne(record, { fetch });
      congregation = congMeta.name;
      congregationUrl = `https://opencommunities.info/edit?id=${congMeta.id}`;
      if (congregation) {
        bodyText += `\n\nListing: ${congregation}\n${congregationUrl}`;
      }
    }

    // S-10: build headers from user-controlled input — sanitize all fields
    const safeName = sanitizeHeader(name);
    const safeEmail = sanitizeHeader(email);

    await mailTransport({
      // S-9: sanitize HTML output from marked to prevent email HTML injection
      bodyText,
      headerFrom: `${safeName} via Open Communities <${safeEmail}>`,
      headerTo: `Open Communities Admin <${ADMIN_EMAIL ?? 'admin@example.test'}>`,
      subject
    });
  } catch (e) {
    log.error('Error sending admin email', e);
  }
}

export function closeTransporter() {
  _client = null;
}

async function mailTransport({
  headerFrom,
  bodyText,
  subject,
  headerTo
}: {
  headerFrom: string;
  bodyText: string;
  subject: string;
  headerTo: string;
}) {
  if (!(MAILGUN_API_KEY && MAILGUN_DOMAIN)) {
    log.warn('Mailgun credentials are not set');
  }

  // S-9: sanitize HTML output to prevent email injection
  const messageHtml = await marked.parseInline(bodyText);
  const sanitized = DOMPurify.sanitize(messageHtml, {
    ALLOWED_ATTR: ['href'],
    ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'br', 'p']
  });
  const html = emailTemplate.replace('%MESSAGE%', sanitized);
  const text = bodyText;

  const client = getClient();

  log.debug('Sending email', { from: headerFrom, subject, to: headerTo });
  await client.messages.create(MAILGUN_DOMAIN as string, {
    from: headerFrom,
    html,
    subject,
    text,
    to: [headerTo]
  });
}

export async function transactionalMail({
  email,
  message,
  name,
  subject
}: TransactionalMailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await mailTransport({
      bodyText: message,
      headerFrom: 'Open Communities <no-reply@m.opencommunities.info>',
      headerTo: `${sanitizeHeader(name)} <${sanitizeHeader(email)}>`,
      subject
    });
    return { ok: true };
  } catch (e) {
    const error = (e as { message?: string }).message ?? 'Unknown email error';
    log.error('Error sending transactional email', e);
    return { error, ok: false };
  }
}

function getClient(): MailgunClient {
  if (_client) {
    return _client;
  }

  const mailgun = new Mailgun(FormData);
  _client = mailgun.client({
    key: MAILGUN_API_KEY as string,
    useFetch: true,
    username: 'api'
  });
  return _client;
}
