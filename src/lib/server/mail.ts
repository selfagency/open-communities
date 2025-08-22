/* region imports */
import Mailgun from 'mailgun.js';
import nodemailer from 'nodemailer';

import type { TypedPocketBase } from '$lib/pocketbase.d';

import { dev } from '$app/environment';
import { ADMIN_EMAIL, MAILGUN_API_KEY } from '$env/static/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import { log } from '$lib/server/logger';
/* endregion imports */

let mg: null | ReturnType<Mailgun['client']> = null;

if (!dev && (!MAILGUN_API_KEY || MAILGUN_API_KEY.trim() === '')) {
	log.warn('Mailgun API key is not set');
} else {
	const mailgun = new Mailgun(FormData);
	mg = mailgun.client({
		key: MAILGUN_API_KEY,
		username: 'api'
	});
}

export async function adminMail(
	{ email, message, name, record, subject }: Record<string, string>,
	api: TypedPocketBase
) {
	// If Mailgun client is initialized and we're not forcing SMTP, prefer Mailgun.
	const forceSmtp = Boolean(process.env.FORCE_SMTP || process.env.SKIP_CAPTCHA);

	if (mg && !forceSmtp) {
		try {
			let congregation: string | undefined;
			let congregationUrl: string | undefined;

			if (record && record.trim() !== '') {
				const congMeta = await api.collection('congregationMeta').getOne(record, { fetch });
				congregation = congMeta.name;
				congregationUrl = `https://opencommunities.info/edit?id=${congMeta.id}`;
				if (congregation) {
					message += `\n\nListing: ${congregation}\n${congregationUrl}`;
				}
			}

			const html = emailTemplate.replace('%MESSAGE%', `<p>${message.replace('\n', '<br />')}</p>`);
			const text = message;

			await mg.messages.create('m.opencommunities.info', {
				from: `${name} via Open Communities <${email}>`,
				html,
				subject,
				text,
				to: [`Admin <${ADMIN_EMAIL}>`]
			});
		} catch (e) {
			log.error('Error sending admin email', e);
		}
	} else {
		// Fallback: send via SMTP (useful in e2e where Mailpit is available on localhost:1025)
		try {
			const transporter = nodemailer.createTransport({
				auth:
					process.env.SMTP_USER && process.env.SMTP_PASS
						? { pass: process.env.SMTP_PASS, user: process.env.SMTP_USER }
						: undefined,
				host: process.env.SMTP_HOST ?? '127.0.0.1',
				port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
				secure: false,
				tls: { rejectUnauthorized: false }
			});

			await transporter.sendMail({
				from: `${name} via Open Communities <${email}>`,
				html: emailTemplate.replace('%MESSAGE%', `<p>${message.replace('\n', '<br />')}</p>`),
				subject,
				text: message,
				to: `Admin <${process.env.ADMIN_EMAIL ?? 'admin@example.test'}>`
			});
		} catch (e) {
			log.error('Error sending admin email via SMTP fallback', e);
		}
	}
}

export async function transactionalMail({ email, message, name, subject }: Record<string, string>) {
	const html = emailTemplate.replace('%MESSAGE%', `<p>${message.replace('\n', '<br />')}</p>`);
	const text = message;

	const forceSmtp = Boolean(process.env.FORCE_SMTP || process.env.SKIP_CAPTCHA);

	if (mg && !forceSmtp) {
		try {
			await mg.messages.create('m.opencommunities.info', {
				from: 'Open Communities <no-reply@m.opencommunities.info>',
				html,
				subject,
				text,
				to: [`${name} <${email}>`]
			});
		} catch (e) {
			log.error('Error sending transactional email via Mailgun', e);
		}
	} else {
		// SMTP fallback
		try {
			const transporter = nodemailer.createTransport({
				auth:
					process.env.SMTP_USER && process.env.SMTP_PASS
						? { pass: process.env.SMTP_PASS, user: process.env.SMTP_USER }
						: undefined,
				host: process.env.SMTP_HOST ?? '127.0.0.1',
				port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
				secure: false,
				tls: { rejectUnauthorized: false }
			});

			await transporter.sendMail({
				from: 'Open Communities <no-reply@m.opencommunities.info>',
				html,
				subject,
				text,
				to: `${name} <${email}>`
			});
		} catch (e) {
			log.error('Error sending transactional email via SMTP fallback', e);
		}
	}
}
