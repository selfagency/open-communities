#!/usr/bin/env node

/**
 * Crawls all English translation keys from PocketBase, translates each to
 * every non-English locale via LibreTranslate, and overwrites all results
 * back to PB (including existing translations).
 *
 * Usage:
 *   PB_API_TOKEN=<token> PB_URL=<url> LT_API_URL=<url> node scripts/translate-all.mjs
 *
 * Env:
 *   PB_API_TOKEN  — PocketBase admin API token (required)
 *   PB_URL        — PocketBase server URL (default: http://localhost:8090)
 *   LT_API_URL    — LibreTranslate API URL (required, e.g. http://localhost:5000)
 *   LT_API_KEY    — LibreTranslate API key (required)
 *   BATCH_SIZE    — PB batch write size (default: 50)
 */

const LOCALES = ['de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];

let PB_URL = process.env.PB_URL || 'http://localhost:8090';
if (PB_URL.endsWith('/')) {
  PB_URL = PB_URL.slice(0, -1);
}
const TOKEN = process.env.PB_API_TOKEN;
let LT_URL = process.env.LT_API_URL;
if (LT_URL?.endsWith('/')) {
  LT_URL = LT_URL.slice(0, -1);
}
const LT_KEY = process.env.LT_API_KEY;
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 50;

if (!TOKEN) {
  console.error('❌ PB_API_TOKEN is required');
  process.exit(1);
}
if (!LT_URL) {
  console.error('❌ LT_API_URL is required');
  process.exit(1);
}
if (!LT_KEY) {
  console.error('❌ LT_API_KEY is required');
  process.exit(1);
}

/* ── Helpers ── */

async function api(method, path, body) {
  const opts = { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` } };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${PB_URL}/api${path}`, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path}: ${res.status} — ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function translateText(text, locale) {
  const body = { q: text, source: 'en', target: locale, format: 'text', api_key: LT_KEY };
  const res = await fetch(`${LT_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Translate failed for ${locale}: ${res.status}`);
  }
  const data = await res.json();
  return data.translatedText;
}

async function batchSend(requests) {
  if (requests.length === 0) {
    return;
  }
  // Try PB batch API first
  const res = await fetch(`${PB_URL}/api/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ requests })
  });
  if (res.ok) {
    return;
  }
  // Fallback: send individually
  console.error(`\n  ⚠  Batch failed (${res.status}), falling back to individual requests`);
  for (const req of requests) {
    try {
      const r = await fetch(`${PB_URL}${req.url}`, {
        method: req.method,
        headers: { ...req.headers, authorization: `Bearer ${TOKEN}` },
        body: req.body ? JSON.stringify(req.body) : undefined
      });
      if (!r.ok) {
        const t = await r.text();
        if (t.includes('validation_not_unique')) {
          continue;
        }
        console.error(`    ⚠  ${req.method} ${req.url}: ${r.status}`);
      }
    } catch {
      console.error(`    ⚠  ${req.method} ${req.url}: request failed`);
    }
  }
}

/* ── Fetch helpers ── */

async function fetchAllRecords() {
  const map = new Map(); // "key|locale" → { id, value }
  let page = 1;
  while (true) {
    const data = await api('GET', `/collections/translations/records?perPage=500&page=${page}&sort=key`);
    for (const r of data?.items ?? []) {
      map.set(`${r.key}|${r.locale}`, { id: r.id, value: r.value });
    }
    if (!data?.items?.length || data.items.length < 500) {
      break;
    }
    page++;
  }
  return map;
}

function extractEnKeys(existingMap) {
  const enKeys = new Map();
  for (const [key, { value }] of existingMap) {
    const [k, locale] = key.split('|');
    if (locale === 'en' && value) {
      enKeys.set(k, value);
    }
  }
  return enKeys;
}

function makeBatchEntry(existing, key, locale, value) {
  const body = { key, locale, value };
  if (existing) {
    return {
      method: 'PATCH',
      url: `/api/collections/translations/records/${existing.id}`,
      body,
      headers: { 'content-type': 'application/json' }
    };
  }
  return {
    method: 'POST',
    url: '/api/collections/translations/records',
    body,
    headers: { 'content-type': 'application/json' }
  };
}

/* ── Main ── */

async function main() {
  console.log(`🔤 Translating all keys via ${LT_URL} → ${PB_URL}`);
  console.log(`   Locales: ${LOCALES.join(', ')}\n`);

  const existingMap = await fetchAllRecords();
  console.log(`   ${existingMap.size} total translation records found\n`);

  const enKeys = extractEnKeys(existingMap);
  console.log(`🔑 ${enKeys.size} English keys with values`);

  let translated = 0;
  let errors = 0;
  const batch = [];

  const sortedKeys = [...enKeys.keys()];
  for (let ki = 0; ki < sortedKeys.length; ki++) {
    const key = sortedKeys[ki];
    const enValue = enKeys.get(key);

    process.stdout.write(`\r  [${ki + 1}/${sortedKeys.length}] ${key}`);

    for (const locale of LOCALES) {
      const existing = existingMap.get(`${key}|${locale}`);

      try {
        const translatedText = await translateText(enValue, locale);
        batch.push(makeBatchEntry(existing, key, locale, translatedText));
        translated++;

        if (batch.length >= BATCH_SIZE) {
          await batchSend(batch);
          batch.length = 0;
          process.stdout.write('.');
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (e) {
        errors++;
        console.error(`\n  ❌ ${key} → ${locale}: ${e.message}`);
      }
    }
  }

  if (batch.length > 0) {
    await batchSend(batch);
    process.stdout.write('.');
  }

  console.log('\n');
  console.log(`✅ Done — ${translated} translated, ${errors} errors`);
}

await main();
