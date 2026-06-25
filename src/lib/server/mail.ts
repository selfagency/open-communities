import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
/* region imports */
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import type { TypedPocketBase } from '$lib/pocketbase.d';
import { log } from '$lib/server/logger';

/* endregion imports */

const { ADMIN_EMAIL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } = env;

// Lazy singleton transporter — created once on first use, reused for all subsequent sends.
// Avoids TCP setup per email and skips verify() in production (one-time check at creation).
let _transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

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
      headerFrom: `${safeName} via Open Communities <${safeEmail}>`,
      headerTo: `Open Communities Admin <${ADMIN_EMAIL ?? 'admin@example.test'}>`,

      // S-9: sanitize HTML output from marked to prevent email HTML injection
      bodyText,
      subject
    });
  } catch (e) {
    log.error('Error sending admin email', e);
  }
}

export function closeTransporter() {
  if (_transporter) {
    _transporter.close();
    _transporter = null;
  }
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
  if (!SMTP_USER || !SMTP_PASS || !SMTP_HOST || !SMTP_PORT) {
    log.warn('SMTP credentials are not set');
  }

  // S-9: sanitize HTML output to prevent email injection
  const messageHtml = await marked.parseInline(bodyText);
  const sanitized = DOMPurify.sanitize(messageHtml, {
    ALLOWED_ATTR: ['href'],
    ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'br', 'p']
  });
  const html = emailTemplate.replace('%MESSAGE%', sanitized);
  const text = bodyText;
  const mail = {
    from: headerFrom,
    html,
    subject,
    text,
    to: [headerTo]
  };

  const transporter = getTransporter();

  // Verify only on first use (dev) or skip in production
  if (dev && typeof transporter.verify === 'function') {
    try {
      await transporter.verify();
    } catch (err) {
      log.error('SMTP transporter verification failed', err);
      throw err;
    }
  }

  log.debug('Sending email', mail);
  await transporter.sendMail(mail);
}

export async function transactionalMail({ email, message, name, subject }: TransactionalMailInput) {
  try {
    await mailTransport({
      headerFrom: 'Open Communities <no-reply@m.opencommunities.info>',
      bodyText: message,
      subject,
      headerTo: `${sanitizeHeader(name)} <${sanitizeHeader(email)}>`
    });
  } catch (e) {
    log.error('Error sending transactional email', e);
  }
}

function getTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
  if (_transporter) return _transporter;

  const smtpPort = Number.parseInt(SMTP_PORT as string, 10);
  const transportOpts: SMTPTransport.Options = {
    host: SMTP_HOST as string,
    port: smtpPort,
    secure: smtpPort === 465,
    tls: { rejectUnauthorized: true }
  };

  if (SMTP_USER && SMTP_PASS) {
    transportOpts.auth = { pass: SMTP_PASS, user: SMTP_USER };
  }

  _transporter = nodemailer.createTransport(transportOpts);
  return _transporter;
}
