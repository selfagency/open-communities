import type SMTPTransport from "nodemailer/lib/smtp-transport";

import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import nodemailer from "nodemailer";

import type { TypedPocketBase } from "$lib/pocketbase.d";

/* region imports */
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import emailTemplate from "$lib/assets/emailTemplate.html?raw";
import { log } from "$lib/server/logger";
/* endregion imports */

const { ADMIN_EMAIL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } = env;

// Lazy singleton transporter — created once on first use, reused for all subsequent sends.
// Avoids TCP setup per email and skips verify() in production (one-time check at creation).
let _transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
	null;

export interface AdminMailInput {
	email: string;
	message: string;
	name: string;
	record?: string;
	subject: string;
}

export interface TransactionalMailInput {
	email: string;
	message: string;
	name: string;
	subject: string;
}

export async function adminMail(
	{ email, message, name, record, subject }: AdminMailInput,
	api: TypedPocketBase,
) {
	try {
		let congregation: string | undefined;
		let congregationUrl: string | undefined;

		if (record && record.trim() !== "") {
			const congMeta = await api
				.collection("congregationMeta")
				.getOne(record, { fetch });
			congregation = congMeta.name;
			congregationUrl = `https://opencommunities.info/edit?id=${congMeta.id}`;
			if (congregation) {
				message += `\n\nListing: ${congregation}\n${congregationUrl}`;
			}
		}

		/* region helpers */
		function sanitizeHeader(value: string): string {
			return value.replace(/[\r\n]/g, " ").trim();
		}
		/* endregion helpers */

		// S-10: from header built from user-controlled name/email — sanitize
		await mailTransport({
			from: `${sanitizeHeader(name)} via Open Communities <${sanitizeHeader(email)}>`,

			// S-9: sanitize HTML output from marked to prevent email HTML injection
			message,
			subject,
			to: `Open Communities Admin <${ADMIN_EMAIL ?? "admin@example.test"}>`,
		});
	} catch (e) {
		log.error("Error sending admin email", e);
	}
}

export function closeTransporter() {
	if (_transporter) {
		_transporter.close();
		_transporter = null;
	}
}

export async function mailTransport({
	from,
	message,
	subject,
	to,
}: {
	from: string;
	message: string;
	subject: string;
	to: string;
}) {
	if (!SMTP_USER || !SMTP_PASS || !SMTP_HOST || !SMTP_PORT) {
		log.warn("SMTP credentials are not set");
	}

	// S-9: sanitize HTML output to prevent email injection
	const messageHtml = marked.parseInline(message) as string;
	const sanitized = DOMPurify.sanitize(messageHtml, {
		ALLOWED_ATTR: ["href"],
		ALLOWED_TAGS: ["a", "b", "i", "em", "strong", "br", "p"],
	});
	const html = emailTemplate.replace("%MESSAGE%", sanitized);
	const text = message;
	const mail = {
		from,
		html,
		subject,
		text,
		to: [to],
	};

	const transporter = getTransporter();

	// Verify only on first use (dev) or skip in production
	if (dev && typeof transporter.verify === "function") {
		try {
			await transporter.verify();
		} catch (err) {
			log.error("SMTP transporter verification failed", err);
			throw err;
		}
	}

	log.debug("Sending email", mail);
	await transporter.sendMail(mail);
}

export async function transactionalMail({
	email,
	message,
	name,
	subject,
}: TransactionalMailInput) {
	try {
		await mailTransport({
			from: "Open Communities <no-reply@m.opencommunities.info>",
			message,
			subject,
			to: `${name} <${email}>`,
		});
	} catch (e) {
		log.error("Error sending transactional email", e);
	}
}

function getTransporter(): nodemailer.Transporter<SMTPTransport.SentMessageInfo> {
	if (_transporter) return _transporter;

	const smtpPort = parseInt(SMTP_PORT as string, 10);
	const transportOpts: SMTPTransport.Options = {
		host: SMTP_HOST as string,
		port: smtpPort,
		secure: smtpPort === 465,
		tls: { rejectUnauthorized: true },
	};

	if (SMTP_USER && SMTP_PASS) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(transportOpts as any).auth = { pass: SMTP_PASS, user: SMTP_USER };
	}

	_transporter = nodemailer.createTransport(transportOpts);
	return _transporter;
}
