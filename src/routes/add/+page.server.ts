/* region imports */
import type { ClientResponseError } from "pocketbase";

import { fail, redirect } from "@sveltejs/kit";
import { isEmpty, isFunction, omit } from "radashi";
import { setError } from "sveltekit-superforms";
import * as z from "zod";

import type { CongregationsResponse, PagesRecord } from "$lib/pocketbase.d";

import { m } from "$lib/paraglide/messages";
import { defaultSchema } from "$lib/schemas/record";
import { throwAsHttpError } from "$lib/server/api";
import { adminMail, transactionalMail } from "$lib/server/mail";
import { validateCaptcha } from "$lib/server/utils";
/* endregion imports */

export const load = async (event) => {
	const { fetch, locals } = event;
	const { api, captureException, validate } = locals;
	const client = api?.authStore?.record;

	try {
		if (!client?.id) {
			throw new Error("Forbidden");
		}

		const content = (await api
			.collection("pages")
			.getFirstListItem(
				api.filter("slug={:slug}", { slug: `add-${client?.lang || "en"}` }),
				{
					fetch,
				},
			)) as PagesRecord;

		return { content, form: { default: await validate(event, defaultSchema) } };
	} catch (error) {
		if ((error as Error).message === "Forbidden") {
			redirect(302, "/login?signUp=true");
		} else {
			if (isFunction(captureException)) {
				await captureException(error, client?.id);
			}
			throwAsHttpError(error as { message?: string; status?: number });
		}
	}
};

export const actions = {
	submit: async (event) => {
		const { fetch, locals } = event;
		const { api, capture, captureException, log, validate } = locals;
		const client = api?.authStore?.record;

		const form = await validate(event, defaultSchema);
		const formData = form.data; // typed as output<typeof defaultSchema> via superforms

		if (isFunction(capture)) {
			await capture(client?.id, "addCongregation");
		}

		try {
			if (!client?.id) {
				throw new Error("Forbidden");
			}

			if (!form.valid) {
				throw new Error("Invalid form data");
			}

			const captchaValid = await validateCaptcha(form);
			if (!captchaValid) {
				return fail(400, { form });
			}

			const {
				accessibility,
				fit,
				health,
				location,
				registration,
				security,
				services,
			} = formData;

			const record = (await api.collection("congregations").create(
				{
					...omit(formData, [
						"accessibility",
						"fit",
						"location",
						"registration",
						"health",
						"security",
						"services",
						"user" as any,
					]),
					...location,
					visible: client?.admin ? formData.visible : false,
				},
				{ fetch },
			)) as CongregationsResponse;

			const congregation = record.id;
			const batch = api.createBatch();
			if (!isEmpty(accessibility))
				batch
					.collection("accessibility")
					.create({ ...accessibility, congregation });
			if (!isEmpty(fit))
				batch.collection("fit").create({ ...fit, congregation });
			if (!isEmpty(registration))
				batch
					.collection("registration")
					.create({ ...registration, congregation });
			if (!isEmpty(health))
				batch.collection("health").create({ ...health, congregation });
			if (!isEmpty(security))
				batch.collection("security").create({ ...security, congregation });
			if (!isEmpty(services))
				batch.collection("services").create({ ...services, congregation });
			await batch.send({ fetch });

			if (!client?.admin) {
				try {
					await api.collection("users").update(client.id, { congregation });

					await transactionalMail({
						email: client.email,
						message: `${m.transactional_submitted({ locale: client.lang || "en" })} ${m.transactional_confirmation({ locale: client.lang || "en" })}`,
						name: client.name as string,
						subject: `${m.transactional_subject({ locale: client.lang || "en" })}`,
					});
				} catch {
					log.error("Failed to retrieve user profile", client.id);
				}
			}

			await adminMail(
				{
					email: client.email,
					message: `
						A new congregation, ${record.name}, has been submitted and requires approval:\n
						https://opencommunities.info/edit?id=${record.id}
					`,
					name: client.name as string,
					subject: `New congregation submitted`,
				},
				api,
			);

			return {
				form,
			};
		} catch (error) {
			if (isFunction(captureException)) {
				await captureException(error, client?.id);
			}
			log.error("add:submit:error", error);

			const err = error as ClientResponseError;

			if (err.message === "Invalid captcha") {
				setError(form, "captcha", m.invalidCaptcha());
			}

			if (err.message === "Failed to create record.") {
				setError(form, "name", m.exists());
			}

			return fail(err.status ?? 400, { form });
		}
	},
};
