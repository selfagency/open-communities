import { createMessage, type Transport } from '@upyo/core';
import { MailgunTransport } from '@upyo/mailgun';
import { SmtpTransport } from '@upyo/smtp';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
/* region imports */
import { env } from '$env/dynamic/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import type { TypedPocketBase } from '$lib/pocketbase.d';
import { log } from '$lib/server/logger';

/* endregion imports */

const { ADMIN_EMAIL, MAILGUN_API_KEY, MAILGUN_DOMAIN, SMTP_HOST, SMTP_PORT } = env;

// Lazy singleton transport — created once on first use, reused for all
// subsequent sends. Uses Mailgun when MAILGUN_API_KEY is present (production),
// otherwise falls back to SMTP (Mailpit in test/dev).
let _transport: Transport<string> | null = null;

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
  _transport = null;
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

  const transport = getTransport();

  log.debug('Sending email', { from: headerFrom, subject, to: headerTo });

  const message = createMessage({
    content: { html, text },
    from: headerFrom,
    subject,
    to: [headerTo]
  });

  const receipt = await transport.send(message);
  if (!receipt.successful) {
    throw new Error(receipt.errorMessages.join(', '));
  }
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

function getTransport(): Transport<string> {
  if (_transport) {
    return _transport;
  }

  if (MAILGUN_API_KEY) {
    _transport = new MailgunTransport({
      apiKey: MAILGUN_API_KEY as string,
      domain: MAILGUN_DOMAIN as string,
      region: 'us',
      retries: 3
    });
  } else {
    // No Mailgun key — use SMTP (Mailpit in test/dev).
    _transport = new SmtpTransport({
      host: SMTP_HOST as string,
      port: Number(SMTP_PORT ?? 587),
      secure: false
    });
  }
  return _transport;
}
