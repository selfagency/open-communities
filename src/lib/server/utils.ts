import type { SuperValidated } from "sveltekit-superforms";

import { setError } from "sveltekit-superforms";

import { env } from "$env/dynamic/private";
import { env as pubEnv } from "$env/dynamic/public";
import { m } from "$lib/paraglide/messages";
import { log } from "$lib/server/logger";

export async function validateCaptcha(
	form: SuperValidated<Record<string, unknown>>,
): Promise<boolean> {
	if (!pubEnv.PUBLIC_CAPTCHA_SITE_KEY || !env.CAPTCHA_SITE_SECRET) {
		log.error("[captcha] Captcha validation is not configured");
		throw new Error("Captcha validation is not configured");
	}

	if (!form.data.captcha) {
		log.error("[captcha] No captcha token provided");
		setError(form, "captcha", m.invalidCaptcha());
		return false;
	}

	log.debug(
		"[captcha] Validating captcha token:",
		(form.data.captcha as string)?.slice(0, 4) + "...",
	);

	const endpoint = `${pubEnv.PUBLIC_CAPTCHA_ENDPOINT}/${pubEnv.PUBLIC_CAPTCHA_SITE_KEY}/siteverify`;
	log.debug("[captcha] Validation endpoint:", endpoint);

	const response = await fetch(endpoint, {
		body: JSON.stringify({
			response: form.data.captcha as string,
			secret: env.CAPTCHA_SITE_SECRET,
		}),
		headers: {
			"Content-Type": "application/json",
		},
		method: "POST",
	});

	const result = await response.json();
	log.debug("[captcha] Validation response:", result);

	if (!result?.success) {
		log.error("[captcha] Validation failed:", result);
		setError(form, "captcha", m.invalidCaptcha());
		return false;
	}

	log.debug("[captcha] Validation successful");
	return true;
}
