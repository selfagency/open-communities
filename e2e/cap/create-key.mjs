#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const port = process.env.CAP_STANDALONE_PORT ?? '3001';
const adminKey = process.env.CAP_ADMIN_KEY ?? 'test_admin_key';
const base = `http://localhost:${port}`;
const outFile = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.e2e', 'cap-key.json');

function guessTokenFromString(s) {
  const m = s.match(/([a-f0-9]{16,64})/i);
  return m ? m[1] : null;
}

async function run() {
  console.log('[cap-setup] waiting for Cap at', base);
  const up = await waitForUp(base, 20000);
  if (!up) {
    console.error('[cap-setup] Cap not reachable at', base);
    process.exit(2);
  }

  const name = process.env.CAP_KEY_NAME || `e2e-${Date.now()}`;

  try {
    // Create key via API
    console.log('[cap-setup] creating key via API');
    const postRes = await fetch(`${base}/server/keys`, {
      body: JSON.stringify({ name }),
      headers: {
        'content-type': 'application/json',
        'x-api-key': adminKey,
      },
      method: 'POST',
    });

    if (!postRes.ok) {
      const text = await postRes.text().catch(() => '');
      console.error('[cap-setup] POST /server/keys failed', postRes.status, text);
      process.exit(3);
    }

    // GET keys and find the created one
    const listRes = await fetch(`${base}/server/keys`, {
      headers: { 'x-api-key': adminKey },
      method: 'GET',
    });

    if (!listRes.ok) {
      const text = await listRes.text().catch(() => '');
      console.error('[cap-setup] GET /server/keys failed', listRes.status, text);
      process.exit(4);
    }

    const listJson = await listRes.json().catch(() => null);
    // listJson may be an array or object; stringify and search if uncertain
    let siteKey = null;
    let secret = null;

    if (Array.isArray(listJson)) {
      for (const item of listJson) {
        if (item?.name === name) {
          siteKey = item.siteKey || item.key || item.id || item.site_key || item.site;
          break;
        }
      }
    } else if (listJson && typeof listJson === 'object') {
      // try to find by name in values
      for (const k of Object.keys(listJson)) {
        const item = listJson[k];
        if (item?.name === name) {
          siteKey = item.siteKey || item.key || item.id || item.site_key || item.site;
          break;
        }
      }
    }

    // If siteKey not found, try to parse textual response
    if (!siteKey) {
      const raw = JSON.stringify(listJson || '');
      siteKey = guessTokenFromString(raw);
    }

    // If we have a siteKey, try GET /server/keys/{siteKey}
    if (siteKey) {
      const getRes = await fetch(`${base}/server/keys/${siteKey}`, {
        headers: { 'x-api-key': adminKey },
        method: 'GET',
      });

      if (getRes.ok) {
        const detail = await getRes.json().catch(() => null);
        secret = detail?.secret || detail?.siteSecret || detail?.site_secret || detail?.secretKey || null;
        if (!secret) {
          // fallback: look for hex strings in returned body
          const raw = JSON.stringify(detail || '');
          const maybe = guessTokenFromString(raw);
          if (maybe) secret = maybe;
        }
      }
    }

    // As a last resort, re-scan the list JSON for two tokens
    if (!siteKey || !secret) {
      const raw = JSON.stringify(listJson || '');
      const matches = [...raw.matchAll(/([a-f0-9]{16,64})/gi)].map((m) => m[1]);
      const uniq = Array.from(new Set(matches));
      if (!siteKey && uniq.length >= 1) siteKey = uniq[0];
      if (!secret && uniq.length >= 2) secret = uniq[1];
    }

    if (!siteKey || !secret) {
      console.error('[cap-setup] failed to determine siteKey/secret');
      console.error('listRes:', JSON.stringify(listJson));
      process.exit(5);
    }

  const payload = { key: siteKey, name, secret, url: base };
    console.log('[cap-setup] writing key to', outFile);
    await fs.mkdir(path.join(path.dirname(outFile)), { recursive: true });
    await fs.writeFile(outFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log('[cap-setup] done');
    process.exit(0);
  } catch (err) {
    console.error('[cap-setup] error', err);
    process.exit(10);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForUp(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { headers: {}, method: 'GET' });
      if (res.ok) return true;
    } catch {
      // ignore
    }
    await sleep(500);
  }
  return false;
}

run();
