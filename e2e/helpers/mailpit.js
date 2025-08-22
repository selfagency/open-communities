const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';

export async function clearMailpit() {
  await fetch(`${MAILPIT_API}/messages`, { method: 'DELETE' });
}

export async function findMessageBySubject(subject, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_API}/messages`);
    if (!res.ok) throw new Error('Mailpit API not reachable');
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.messages ?? data.items ?? [];
    const found = arr.find((m) => (m.subject || m.Subject || '').includes(subject));
    if (found) return found;
    await new Promise((r) => setTimeout(r, 250));
  }
  return undefined;
}
