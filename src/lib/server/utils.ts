import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';

import { CAPTCHA_SITE_SECRET } from '$env/static/private';
import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';
import { m } from '$lib/paraglide/messages';

export async function validateCaptcha(form: SuperValidated<Record<string, unknown>>) {
	if (!PUBLIC_CAPTCHA_SITE_KEY || !CAPTCHA_SITE_SECRET) {
		throw new Error('Captcha validation is not configured');
	}

	if (!form.data.captcha) {
		setError(form, 'captcha', m.invalidCaptcha());
		return fail(400, { form });
	} else {
		const captchaValid = (
			await (
				await fetch(`https://captcha.selfagency.dev/${PUBLIC_CAPTCHA_SITE_KEY}/siteverify`, {
					body: JSON.stringify({
						response: form.data.captcha as string,
						secret: CAPTCHA_SITE_SECRET as string
					}),
					headers: {
						'Content-Type': 'application/json'
					},
					method: 'POST'
				})
			)?.json()
		)?.success;

		if (!captchaValid) {
			setError(form, 'captcha', m.invalidCaptcha());
			return fail(400, { form });
		}
	}
}
