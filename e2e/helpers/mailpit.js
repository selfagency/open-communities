/**
 * Mailpit API helpers for E2E tests.
 * Mailpit exposes a REST API at the MAILPIT_API URL (default http://127.0.0.1:8025/api/v1).
 */

const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';

/**
 * Delete all messages from Mailpit.
 */
export async function clearMailpit() {
  const res = await fetch(`${MAILPIT_API}/messages`, { method: 'DELETE' });
  if (!res.ok && res.status !== 405) {
    throw new Error(`clearMailpit failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * Poll Mailpit for a message whose subject contains `subjectPart`.
 * Resolves when found, rejects after `timeoutMs` (default 10s).
 */
export async function findMessageBySubject(subjectPart, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${MAILPIT_API}/messages?limit=50`);
    if (res.ok) {
      const body = await res.json();
      const messages = body.messages ?? body;
      if (Array.isArray(messages)) {
        const match = messages.find((m) =>
          (m.Subject ?? '').includes(subjectPart),
        );
        if (match) return match;
      }
    }
    await sleep(500);
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
