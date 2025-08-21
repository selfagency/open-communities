import { spawn } from 'child_process';
import nodemailer from 'nodemailer';
import { uid } from 'radashi';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CongregationMetaResponse, TypedPocketBase } from '$lib/pocketbase.d';

import { Collections, MetaDenominationOptions } from '$lib/pocketbase.d';

// hoist-safe mock: mailgun.js client.messages.create will use nodemailer to send SMTP to Mailpit
vi.mock('mailgun.js', () => ({
	default: function MockMailgun(_formData: unknown) {
		void _formData;
		return {
			client: (_opts: unknown) => ({
				messages: {
					create: async (
						_domain: string,
						data: {
							from: string;
							html?: string;
							subject: string;
							text?: string;
							to: string | string[];
						}
					) => {
						void _opts;
						// capture last sent mail for tests
						try {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(global as any).__lastMail = {
								from: data.from,
								html: data.html,
								subject: data.subject,
								text: data.text,
								to: data.to
							};
						} catch {
							// ignore potential globals write errors in test environment
						}
						const transporter = nodemailer.createTransport({
							host: '127.0.0.1',
							port: 1025,
							secure: false,
							tls: { rejectUnauthorized: false }
						});

						await transporter.sendMail({
							from: data.from,
							html: data.html,
							subject: data.subject,
							text: data.text,
							to: Array.isArray(data.to) ? data.to.join(',') : data.to
						});

						return { id: 'mock-sent' };
					}
				}
			})
		};
	}
}));

vi.mock('$env/static/private', () => ({
	ADMIN_EMAIL: 'admin@example.test',
	MAILGUN_API_KEY: 'test-key'
}));

import { adminMail, transactionalMail } from './mail';

async function ensureMailpitRunning() {
	const check = async () => {
		try {
			const res = await fetch('http://localhost:8025/api/v1/messages');
			return res.ok;
		} catch {
			return false;
		}
	};

	// if Mailpit is already reachable, we're done
	if (await check()) return;

	// In CI we expect the runner to provide Mailpit as a service. Do not attempt to spawn
	// the binary in CI; instead poll briefly and fail early so CI setup issues are visible.
	if (process.env.CI) {
		const deadline = Date.now() + 10000;
		while (Date.now() < deadline) {
			if (await check()) return;
			await new Promise((r) => setTimeout(r, 250));
		}
		throw new Error('Mailpit not reachable at http://localhost:8025 in CI');
	}

	// Local developer run: try to spawn a local mailpit binary if available, then poll.
	try {
		const child = spawn('mailpit', [], { detached: true, stdio: 'ignore' });
		child.unref();
	} catch (e) {
		// ignore spawn errors for local runs; we'll still poll for a running service
		void e;
	}

	const deadline = Date.now() + 10000;
	while (Date.now() < deadline) {
		if (await check()) return;

		await new Promise((r) => setTimeout(r, 250));
	}
}

async function findMessageBySubject(subject: string) {
	const deadline = Date.now() + 8000;
	while (Date.now() < deadline) {
		const res = await fetch('http://localhost:8025/api/v1/messages');
		if (!res.ok) throw new Error('Mailpit API not reachable');
		const dataRaw = await res.json();
		// normalize possible response shapes: array, { messages: [] }, { items: [] }, or keyed object
		let list: Record<string, unknown>[] = [];
		if (Array.isArray(dataRaw)) list = dataRaw as { id?: string; subject?: string }[];
		else if (dataRaw && typeof dataRaw === 'object') {
			const asObj = dataRaw as Record<string, unknown>;
			if (Array.isArray(asObj.messages))
				list = asObj.messages as { id?: string; subject?: string }[];
			else if (Array.isArray(asObj.items))
				list = asObj.items as { id?: string; subject?: string }[];
			else {
				for (const v of Object.values(asObj)) {
					if (Array.isArray(v)) list = list.concat(v as { id?: string; subject?: string }[]);
				}
			}
		}

		// normalize each message to ensure we have an `id` and `subject` regardless of API shape
		const normalized = list.map((m) => {
			const msg = m as Record<string, unknown>;
			const id =
				(msg.id as string) ??
				(msg.ID as string) ??
				(msg.Id as string) ??
				(msg._id as string) ??
				(msg.messageId as string) ??
				undefined;
			const subjectVal =
				(msg.subject as string) ??
				(msg.Subject as string) ??
				(msg.SubjectLine as string) ??
				undefined;
			return { id, raw: msg, subject: subjectVal };
		});

		const found = normalized.find(
			(m) => typeof m.subject === 'string' && m.subject.includes(subject)
		);
		if (found) return found as { id?: string; subject?: string };

		// wait a bit before retrying

		await new Promise((r) => setTimeout(r, 300));
	}

	// final fetch for debug
	try {
		const res = await fetch('http://localhost:8025/api/v1/messages');
		const data = await res.json();
		// print a short summary for debugging

		console.debug('Mailpit messages (sample):', Array.isArray(data) ? data.slice(0, 5) : data);
	} catch (e) {
		console.debug('Mailpit API fetch failed at final debug:', e);
	}

	return undefined;
}

// cleanup Mailpit between tests to avoid cross-test contamination
afterEach(async () => {
	try {
		// delete all messages
		await fetch('http://localhost:8025/api/v1/messages', { method: 'DELETE' });
		// small pause to ensure Mailpit processed deletion
		await new Promise((r) => setTimeout(r, 100));
	} catch (e) {
		// ignore cleanup failures in test environment
		console.debug('Mailpit cleanup error', e);
	}
});

describe('src/lib/server/mail', () => {
	it('sends transactional email via SMTP (mailpit)', async () => {
		await ensureMailpitRunning();

		const txSubject = `TxSubject-${uid(8)}`;

		const payload = {
			email: 'user@example.test',
			message: 'Hello world',
			name: 'Test',
			subject: txSubject
		};

		await transactionalMail(payload as unknown as Record<string, string>);

		// prefer checking the captured mail from the SMTP mock if available
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const lastMail = (global as any).__lastMail as undefined | { subject?: string };
		if (lastMail) {
			expect(lastMail.subject).toContain(txSubject);
			return;
		}

		// allow delivery to Mailpit if SMTP mock not used
		await new Promise((r) => setTimeout(r, 500));

		const found = await findMessageBySubject(txSubject);
		expect(found).toBeTruthy();
	}, 20000);

	it('sends admin email with listing appended when record present', async () => {
		await ensureMailpitRunning();

		const fakeApi = {
			collection: (name: string) => {
				if (name === 'congregationMeta') {
					return {
						getOne: async (id: string) => {
							const now = new Date().toISOString();
							const resp: CongregationMetaResponse = {
								accessibility: null,
								clergy: '',
								collectionId: 'cong_meta_col',
								// use string for collectionName to avoid complex enum typing in test
								collectionName: Collections.CongregationMeta,
								contactEmail: '',
								contactName: '',
								contactUrl: '',
								created: now,
								denomination: MetaDenominationOptions.other as MetaDenominationOptions,
								expand: undefined,
								fit: null,
								flavor: '',
								health: null,
								id,
								location: null,
								name: 'Congregation Name',
								notes: '',
								owner: '',
								registration: null,
								security: null,
								services: null,
								updated: now,
								visible: true
							} as CongregationMetaResponse;
							return resp;
						}
					};
				}
				// fallback minimal shape
				return { getOne: async () => ({}) as unknown };
			}
		} as unknown as TypedPocketBase;

		const adminSubject = `AdminSubject-${uid(8)}`;

		const payload = {
			email: 'from@example.test',
			message: 'Please review',
			name: 'Sender',
			record: 'abc',
			subject: adminSubject
		};

		await adminMail(payload as unknown as Record<string, string>, fakeApi);

		// allow delivery
		await new Promise((r) => setTimeout(r, 500));

		// prefer checking the captured mail from the SMTP mock if available
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const lastMail = (global as any).__lastMail as undefined | { html?: string; text?: string };
		if (lastMail) {
			const hay = `${lastMail.html ?? ''} ${lastMail.text ?? ''}`;
			expect(hay).toContain('Listing: Congregation Name');
			return;
		}

		const found = await findMessageBySubject(adminSubject);
		expect(found).toBeTruthy();
		console.error('Found message from list search:', found);

		// fetch raw source with retries — Mailpit may not have raw persisted instantly
		let raw = '';
		const rawDeadline = Date.now() + 5000;
		while (Date.now() < rawDeadline) {
			const rawRes = await fetch(`http://localhost:8025/api/v1/messages/${found!.id}/raw`);
			if (rawRes.ok) {
				raw = await rawRes.text();
				break;
			}
			// backoff a bit
			await new Promise((r) => setTimeout(r, 250));
		}
		// if raw not available, fetch message details and search there
		if (!raw) {
			const detailRes = await fetch(`http://localhost:8025/api/v1/messages/${found!.id}`);
			if (detailRes.ok) {
				const detail = await detailRes.json();
				const haystack = JSON.stringify(detail);
				expect(haystack).toContain('Listing: Congregation Name');
			} else {
				// gather diagnostics: message detail failed, fetch full messages list and print useful info
				const detailText = await detailRes.text().catch(() => '<no-body>');
				console.error('Mailpit /messages/{id} non-ok:', {
					body: detailText,
					id: found!.id,
					status: detailRes.status
				});
				try {
					const listRes = await fetch('http://localhost:8025/api/v1/messages');
					const listBody = await listRes.text();
					console.error('Mailpit messages list raw:', listBody);
				} catch (e) {
					console.debug('Failed to fetch Mailpit messages list for diagnostics:', e);
				}
				// final assertion will fail and show last failed raw (empty) — keep test informative
				expect(raw).toContain('Listing: Congregation Name');
			}
		} else {
			expect(raw).toContain('Listing: Congregation Name');
		}
	}, 20000);
});
