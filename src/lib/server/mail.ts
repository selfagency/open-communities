/* region imports */
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

import type { TypedPocketBase } from '$lib/pocketbase.d';

import { MAILGUN_API_KEY } from '$env/static/private';
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

export async function adminMail(data: Record<string, string | undefined>, api: TypedPocketBase) {
	try {
		if (data?.record && data.record !== '') {
			const record = await api.collection('congregationMeta').getOne(data.record, { fetch });
			data.congregation = record.name;
			data.congregationUrl = `https://opencommunities.info/edit?id=${record.id}`;
		}

		const res = await fetch('https://usebasin.com/f/a0498e979c2a', {
			body: JSON.stringify(data),
			headers: {
				Accept: 'application/json'
			},
			method: 'POST'
		});

		if (res.status !== 200) {
			throw new Error(JSON.stringify(await res.json()));
		}
	} catch (e) {
		log.error('Error sending admin email', e);
	}
}

export async function transactionalMail({ email, message, name, subject }: Record<string, string>) {
	const html = message;
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
