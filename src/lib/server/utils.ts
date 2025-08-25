import type { SuperValidated } from 'sveltekit-superforms';

import { fail } from '@sveltejs/kit';
import { setError } from 'sveltekit-superforms';

import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
// SKIP_CAPTCHA is intentionally read from runtime env to avoid requiring
// a static build-time env export. Use process.env for test-time toggles.
const SKIP_CAPTCHA = process.env.SKIP_CAPTCHA;
import { m } from '$lib/paraglide/messages';

export async function validateCaptcha(form: SuperValidated<Record<string, unknown>>) {
	// Test harness: allow skipping captcha validation when SKIP_CAPTCHA is set.
	// This is intentionally opt-in via environment for e2e runs.
	if (SKIP_CAPTCHA && SKIP_CAPTCHA !== '') {
		return true;
	}

	if (!pubEnv.PUBLIC_CAPTCHA_SITE_KEY || !env.CAPTCHA_SITE_SECRET) {
		throw new Error('Captcha validation is not configured');
	}

	if (!form.data.captcha) {
		setError(form, 'captcha', m.invalidCaptcha());
		return fail(400, { form });
	} else {
		const captchaValid = (
			await (
				await fetch(`${env.PUBLIC_CAPTCHA_ENDPOINT}/${pubEnv.PUBLIC_CAPTCHA_SITE_KEY}/siteverify`, {
					body: JSON.stringify({
						response: form.data.captcha as string,
						secret: env.CAPTCHA_SITE_SECRET
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
		} else {
			return captchaValid;
		}
	}
}
