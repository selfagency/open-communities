import { CAPTCHA_SITE_SECRET } from '$env/static/private';
import { PUBLIC_CAPTCHA_SITE_KEY } from '$env/static/public';

export async function validateCaptcha(captcha: string | undefined): Promise<void> {
	if (!PUBLIC_CAPTCHA_SITE_KEY || !CAPTCHA_SITE_SECRET) {
		throw new Error('Captcha validation is not configured');
	}

	if (!captcha) {
		throw new Error('Captcha is required');
	}

	if (!captcha) {
		throw new Error('Invalid captcha');
	} else {
		const captchaValid = (
			await (
				await fetch(`https://captcha.selfagency.dev/${PUBLIC_CAPTCHA_SITE_KEY}/siteverify`, {
					body: JSON.stringify({
						response: captcha,
						secret: CAPTCHA_SITE_SECRET
					}),
					headers: {
						'Content-Type': 'application/json'
					},
					method: 'POST'
				})
			)?.json()
		)?.success;

		if (!captchaValid) {
			throw new Error('Invalid captcha');
		}
	}
}
