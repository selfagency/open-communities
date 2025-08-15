/* region imports */
import FormData from 'form-data';
import Mailgun from 'mailgun.js';

import type { TypedPocketBase } from '$lib/pocketbase.d';

import { MAILGUN_API_KEY } from '$env/static/private';
import { log } from '$lib/server/logger';
/* endregion imports */

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
	key: MAILGUN_API_KEY,
	username: 'api'
});

export async function adminMail(data: Record<string, string | undefined>, api: TypedPocketBase) {
	const formData = new FormData();
	for (const key in data) {
		formData.append(key, data[key]);
	}

	if (data?.record && data.record !== '') {
		const record = await api.collection('congregationMeta').getOne(data.record, { fetch });
		formData.append('congregation', record.name);
		formData.append('congregationUrl', `https://opencommunities.info/edit?id=${record.id}`);
	}

	const res = await fetch('https://usebasin.com/f/a0498e979c2a', {
		body: formData.toString(),
		headers: {
			Accept: 'application/json'
		},
		method: 'POST'
	});

	if (res.status !== 200) {
		throw new Error(await res.json());
	}
}

export async function transactionalMail({ email, message, name, subject }: Record<string, string>) {
	const html = message;
	const text = message;

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
		throw e;
	}
}
