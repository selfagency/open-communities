const MAILPIT_API = process.env.MAILPIT_API ?? 'http://127.0.0.1:8025/api/v1';

export async function clearMailpit() {
  const res = await fetch(`${MAILPIT_API}/messages`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to clear Mailpit messages: ${res.status} ${res.statusText}`);
  }
}

/**
 * Find a Mailpit message by subject (case-insensitive). Optionally filter by `to` address.
 * Returns the first matching message or undefined when timeout is reached.
 */
export async function findMessageBySubject(subject, timeout = 8000, to) {
  const deadline = Date.now() + timeout;
  let lastPayload = null;
  const needle = (subject || '').toLowerCase();

  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_API}/messages`);
    if (!res.ok) throw new Error('Mailpit API not reachable');
    const data = await res.json();
    // support several shapes returned by various mailpit versions
    const arr = Array.isArray(data) ? data : data.messages ?? data.items ?? [];
    lastPayload = arr;

    const found = arr.find((m) => {
      const subj = (m.subject || m.Subject || '').toString().toLowerCase();
      if (!subj.includes(needle)) return false;
      if (to) {
        const recipients = [];
        if (m.to) recipients.push(...(Array.isArray(m.to) ? m.to : [m.to]));
        if (m.recipients) recipients.push(...(Array.isArray(m.recipients) ? m.recipients : [m.recipients]));
        const hasTo = recipients.some((r) => (r || '').toString().toLowerCase().includes(to.toLowerCase()));
        return hasTo;
      }
      return true;
    });

    if (found) return found;
    await new Promise((r) => setTimeout(r, 250));
  }

  // helpful debug: show subjects of last fetch if nothing found
  try {
    const subjects = (lastPayload || []).slice(0, 10).map((m) => ({ id: m.id, subject: m.subject || m.Subject }));
    console.warn(`[mailpit] findMessageBySubject timeout; checked subjects: ${JSON.stringify(subjects)}`);
  } catch {
    // ignore
  }

  return undefined;
}
