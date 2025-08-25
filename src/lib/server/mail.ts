/* region imports */
import nodemailer from 'nodemailer';

import type { TypedPocketBase } from '$lib/pocketbase.d';

import { env } from '$env/dynamic/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import { log } from '$lib/server/logger';
/* endregion imports */

// transporter will be created per-call in mailTransport so we can conditionally
// include auth only when credentials are provided (Mailpit often runs without auth)

const { ADMIN_EMAIL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } = env;

export async function adminMail(
	{ email, message, name, record, subject }: Record<string, string>,
	api: TypedPocketBase
) {
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

		await mailTransport({
			from: `${name} via Open Communities <${email}>`,
			message,
			subject,
			to: `Open Communities Admin <${ADMIN_EMAIL ?? 'admin@example.test'}>`
		});
	} catch (e) {
		log.error('Error sending admin email', e);
	}
}

export async function mailTransport({ from, message, subject, to }: Record<string, string>) {
	if (!SMTP_USER || !SMTP_PASS || !SMTP_HOST || !SMTP_PORT) {
		log.warn('SMTP credentials are not set');
	}

	const html = emailTemplate?.replace('%MESSAGE%', `<p>${message?.replace('\n', '<br />')}</p>`);
	const text = message;
	const mail = {
		from,
		html,
		subject,
		text,
		to: [to]
	};

	// build transport options and include auth only if provided
	const transportOpts = {
		host: SMTP_HOST as string,
		port: parseInt(SMTP_PORT as string, 10),
		secure: false,
		tls: { rejectUnauthorized: false }
	} as unknown as nodemailer.TransportOptions;

	if (SMTP_USER && SMTP_PASS) {
		// include auth only when provided
		// reorder pass before user to satisfy lint rule
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(transportOpts as any).auth = { pass: SMTP_PASS, user: SMTP_USER };
	}

	const transporter = nodemailer.createTransport(transportOpts);

	log.debug('Verifying SMTP transporter');
	if (typeof transporter.verify === 'function') {
		try {
			await transporter.verify();
		} catch (err) {
			log.error('SMTP transporter verification failed', err);
			throw err;
		}
	} else {
		log.debug('transporter.verify is not available in this runtime, skipping verification');
	}

	log.debug('Sending email', mail);
	await transporter.sendMail(mail);
}

export async function transactionalMail({ email, message, name, subject }: Record<string, string>) {
	try {
		await mailTransport({
			from: 'Open Communities <no-reply@m.opencommunities.info>',
			message,
			subject,
			to: `${name} <${email}>`
		});
	} catch (e) {
		log.error('Error sending transactional email', e);
	}
}
