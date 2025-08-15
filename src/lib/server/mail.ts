/* region imports */
import Mailgun from 'mailgun.js';

import type { TypedPocketBase } from '$lib/pocketbase.d';

import { ADMIN_EMAIL, MAILGUN_API_KEY } from '$env/static/private';
import emailTemplate from '$lib/assets/emailTemplate.html?raw';
import { log } from '$lib/server/logger';
/* endregion imports */

let mg: null | ReturnType<Mailgun['client']> = null;

if (!MAILGUN_API_KEY || MAILGUN_API_KEY.trim() === '') {
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
	if (mg) {
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
		log.warn('Mailgun client is not initialized');
	}
}

export async function transactionalMail({ email, message, name, subject }: Record<string, string>) {
	const html = emailTemplate.replace('%MESSAGE%', `<p>${message.replace('\n', '<br />')}</p>`);
	const text = message;

	if (mg) {
		try {
			await mg.messages.create('m.opencommunities.info', {
				from: 'Open Communities <no-reply@m.opencommunities.info>',
				html,
				subject,
				text,
				to: [`${name} <${email}>`]
			});
		} catch (e) {
			log.error('Error sending transactional email', e);
		}
	} else {
		log.warn('Mailgun client is not initialized');
	}
}
