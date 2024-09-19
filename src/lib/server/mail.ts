/* region imports */
import type { TypedPocketBase } from '$lib/types';
/* endregion imports */

export async function sendMail(data: any, api: TypedPocketBase) {
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
		method: 'POST',
		headers: {
			Accept: 'application/json'
		},
		body: formData
	});

	if (res.status !== 200) {
		throw new Error(await res.json());
	}
}
