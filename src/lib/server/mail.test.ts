// @vitest-environment node

import { spawn } from 'child_process';
import { sleep, uid } from 'radashi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  Collections,
  CongregationMetaResponse,
  MetaDenominationOptions,
  TypedPocketBase
} from '$lib/pocketbase.d';

// mock the raw email template asset so mail.ts can call .replace() on it
vi.mock('$lib/assets/emailTemplate.html?raw', () => ({
  default: '<!doctype html><html><body>%MESSAGE%</body></html>'
}));
// (use shared mocks in src/test/mocks)

import { adminMail, transactionalMail } from './mail';

async function ensureMailpitRunning() {
  const check = async () => {
    try {
      // prefer the lightweight /info endpoint to confirm Mailpit readiness
      const res = await fetch('http://localhost:8025/api/v1/info', {
        headers: {
          accept: 'application/json'
        }
      });
      console.debug('mailpit running', res.ok);
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
      await sleep(250);
    }
    throw new Error('Mailpit not reachable at http://localhost:8025 in CI');
  } else {
    // Local developer run: try to spawn a local mailpit binary if available, then poll.
    try {
      const child = spawn('mailpit', [], { detached: true, stdio: 'ignore' });
      child.unref();
    } catch (e) {
      // ignore spawn errors for local runs; we'll still poll for a running service
      void e;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (await check()) return;
        await sleep(250);
      }
    }
  }
}

beforeEach(async () => {
  await ensureMailpitRunning();
});

// cleanup Mailpit between tests to avoid cross-test contamination
afterEach(async () => {
  try {
    // only attempt cleanup if Mailpit is reachable (avoid noisy "Failed to fetch" logs)
    try {
      const info = await fetch('http://localhost:8025/api/v1/info', {
        headers: {
          accept: 'application/json'
        }
      });
      if (!info.ok) {
        console.debug('Mailpit not reachable for cleanup (non-ok /info)');
        return;
      }
    } catch {
      console.debug('Mailpit not reachable for cleanup (fetch failed), skipping DELETE');
      return;
    }

    // delete all messages
    await fetch('http://localhost:8025/api/v1/messages', {
      headers: {
        accept: 'application/json'
      },
      method: 'DELETE'
    });
    // small pause to ensure Mailpit processed deletion
    await sleep(100);
  } catch (e) {
    // ignore cleanup failures in test environment
    console.debug('Mailpit cleanup error', e);
  }
});

async function findMessageBySubject(subject: string) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const res = await fetch('http://localhost:8025/api/v1/messages', {
      headers: {
        accept: 'application/json'
      }
    });
    if (!res.ok) throw new Error('Mailpit API not reachable');
    const dataRaw = await res.json();
    // normalize possible response shapes: array, { messages: [] }, { items: [] }, or keyed object
    let list: Record<string, unknown>[] = [];
    if (Array.isArray(dataRaw)) list = dataRaw as { id?: string; subject?: string }[];
    else if (dataRaw && typeof dataRaw === 'object') {
      const asObj = dataRaw as Record<string, unknown>;
      if (Array.isArray(asObj.messages)) list = asObj.messages as { id?: string; subject?: string }[];
      else if (Array.isArray(asObj.items)) list = asObj.items as { id?: string; subject?: string }[];
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
      const subjectVal = (msg.subject as string) ?? (msg.Subject as string) ?? (msg.SubjectLine as string) ?? undefined;
      return { id, raw: msg, subject: subjectVal };
    });

    const found = normalized.find((m) => typeof m.subject === 'string' && m.subject.includes(subject));
    if (found) return found as { id?: string; subject?: string };

    // wait a bit before retrying

    await sleep(300);
  }

  // final fetch for debug
  try {
    const res = await fetch('http://localhost:8025/api/v1/messages', {
      headers: {
        accept: 'application/json'
      }
    });
    const data = await res.json();
    // print a short summary for debugging

    console.debug('Mailpit messages (sample):', Array.isArray(data) ? data.slice(0, 5) : data);
  } catch (e) {
    console.debug('Mailpit API fetch failed at final debug:', e);
  }

  return undefined;
}

describe.skipIf(!process.env.MAILPIT_API)('src/lib/server/mail', () => {
  it('sends transactional email via SMTP (mailpit)', async () => {
    await ensureMailpitRunning();

    const txSubject = `TxSubject-${uid(8)}`;

    const payload = {
      email: 'user@example.test',
      message: 'Hello world',
      name: 'Test',
      subject: txSubject
    };

    await transactionalMail(payload);

    // allow delivery to Mailpit
    await sleep(500);

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
                collectionName: 'CongregationMeta' as Collections,
                contactEmail: '',
                contactName: '',
                contactUrl: '',
                created: now,
                denomination: 'other' as MetaDenominationOptions,
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

    await adminMail(payload, fakeApi);

    // allow delivery to Mailpit
    await sleep(500);

    // ensure a message with the expected subject made it to Mailpit
    const found = await findMessageBySubject(adminSubject);
    expect(found).toBeTruthy();
    console.error('Found message from list search:', found);

    // fetch raw source and assert listing presence
    let raw = '';
    const rawDeadline = Date.now() + 5000;
    while (Date.now() < rawDeadline) {
      const rawRes = await fetch(`http://localhost:8025/api/v1/messages/${found!.id}/raw`, {
        headers: {
          accept: 'application/json'
        }
      });
      if (rawRes.ok) {
        raw = await rawRes.text();
        break;
      }
      await sleep(250);
    }

    // if raw not available, fetch message details and search there
    if (!raw) {
      const detailRes = await fetch(`http://localhost:8025/api/v1/message/${found!.id}`, {
        headers: {
          accept: 'application/json'
        }
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        // Check HTML and Text fields directly instead of stringifying the whole object
        const htmlContent = detail.HTML || '';
        const textContent = detail.Text || '';

        if (htmlContent.includes('Listing: Congregation Name') || textContent.includes('Listing: Congregation Name')) {
          // Test passes
          return;
        }

        // Fallback to checking the whole object
        const haystack = JSON.stringify(detail);
        expect(haystack).toContain('Listing: Congregation Name');
      } else {
        const detailText = await detailRes.text().catch(() => '<no-body>');
        console.error('Mailpit /messages/{id} non-ok:', {
          body: detailText,
          id: found!.id,
          status: detailRes.status
        });
        try {
          const listRes = await fetch('http://localhost:8025/api/v1/messages', {
            headers: {
              accept: 'application/json'
            }
          });
          const listBody = await listRes.text();
          console.error('Mailpit messages list raw:', listBody);
          // Since we have the message list, let's check if the content is in the snippet
          const listData = JSON.parse(listBody);
          const foundMessage = listData.messages?.find((m: Record<string, unknown>) => m.ID === found!.id);
          if (foundMessage && foundMessage.Snippet) {
            expect(foundMessage.Snippet).toContain('Listing: Congregation Name');
            return; // Test passed, exit early
          }
        } catch (e) {
          console.debug('Failed to fetch Mailpit messages list for diagnostics:', e);
        }
        // If we get here, we couldn't find the content anywhere
        throw new Error(
          `Could not verify email content. Raw fetch failed, detail fetch failed, and snippet not found. Detail status: ${detailRes.status}`
        );
      }
    } else {
      expect(raw).toContain('Listing: Congregation Name');
    }
  }, 20000);
});
