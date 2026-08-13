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
 *   CHECKPOINT    — resume state file path (default: scripts/.translate-checkpoint.json)
 *
 * The script saves progress to a checkpoint file after every batch write.
 * If interrupted, re-run with the same env vars to resume from where it left off.
 */

const LOCALES = ['de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const CHECKPOINT_FILE =
  process.env.CHECKPOINT || resolve(dirname(fileURLToPath(import.meta.url)), '.translate-checkpoint.json');

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

/* ── Checkpoint helpers ── */

function loadCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      const raw = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8'));
      return new Set(raw.completed || []);
    }
  } catch {
    /* corrupted file — start fresh */
  }
  return new Set();
}

function saveCheckpoint(completed) {
  try {
    writeFileSync(CHECKPOINT_FILE, `${JSON.stringify({ completed: [...completed] }, null, 2)}\n`);
  } catch {
    // best-effort — resume still works from PB state
  }
}

/* ── Helpers ── */

async function api(method, path, body) {
  const opts = { headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, method };
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
  const body = { api_key: LT_KEY, format: 'text', q: text, source: 'en', target: locale };
  const res = await fetch(`${LT_URL}/translate`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
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
    body: JSON.stringify({ requests }),
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    method: 'POST'
  });
  if (res.ok) {
    return;
  }
  // Fallback: send individually
  console.error(`\n  ⚠  Batch failed (${res.status}), falling back to individual requests`);
  for (const req of requests) {
    try {
      const r = await fetch(`${PB_URL}${req.url}`, {
        body: req.body ? JSON.stringify(req.body) : undefined,
        headers: { ...req.headers, authorization: `Bearer ${TOKEN}` },
        method: req.method
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

/* ── Main ── */

async function translatePageLocale(p, locale, pageVariantsMap, batch, checkpoint) {
  const ck = `page:${p.id}|${locale}`;
  if (checkpoint.has(ck)) {
    return 0;
  }

  try {
    const [title, description, content] = await Promise.all([
      translateText(p.title || '', locale),
      translateText(p.description || '', locale),
      translateText(p.content, locale)
    ]);
    batch.push(
      makePageVariantEntry(pageVariantsMap.get(`${p.id}|${locale}`), p.id, locale, title, description, content)
    );
    return 1;
  } catch (e) {
    console.error(`\n  ❌ ${p.slug} → ${locale}: ${e.message}`);
    return -1;
  }
}

async function translatePages(pages, pageVariantsMap, checkpoint) {
  let translated = 0;
  let errors = 0;
  const batch = [];

  const enPages = pages.filter((p) => p.lang === 'en' && p.content);
  for (let i = 0; i < enPages.length; i++) {
    const p = enPages[i];

    for (const locale of LOCALES) {
      const result = await translatePageLocale(p, locale, pageVariantsMap, batch, checkpoint);
      if (result === 1) {
        translated++;
      } else if (result === -1) {
        errors++;
      }
      await flushBatch(batch, checkpoint);
    }

    process.stdout.write(`\r  [${i + 1}/${enPages.length}] page: ${p.slug}`);
  }

  await flushBatch(batch, checkpoint);
  process.stdout.write('\n');
  return { errors, translated };
}

async function fetchAllPages() {
  const pages = [];
  let page = 1;
  while (true) {
    const data = await api('GET', `/collections/pages/records?perPage=500&page=${page}`);
    for (const p of data?.items ?? []) {
      pages.push(p);
    }
    if (!data?.items?.length || data.items.length < 500) {
      break;
    }
    page++;
  }
  return pages;
}

async function fetchAllPageVariants() {
  const map = new Map(); // "pageId|language" → { id, title, description, content }
  let page = 1;
  while (true) {
    const data = await api('GET', `/collections/pageVariants/records?perPage=500&page=${page}`);
    for (const v of data?.items ?? []) {
      map.set(`${v.page}|${v.language}`, { content: v.content, description: v.description, id: v.id, title: v.title });
    }
    if (!data?.items?.length || data.items.length < 500) {
      break;
    }
    page++;
  }
  return map;
}

function makePageVariantEntry(existing, pageId, language, title, description, content) {
  const body = { content, description, language, page: pageId, title };
  if (existing) {
    return {
      body,
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
      url: `/api/collections/pageVariants/records/${existing.id}`
    };
  }
  return {
    body,
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    url: '/api/collections/pageVariants/records'
  };
}

async function processItemLocale(item, locale, enValue, existingMap, batch, checkpoint) {
  const entryKey = `${item.key}|${locale}`;
  if (checkpoint.has(entryKey)) {
    return 0;
  }

  try {
    const translatedText = await translateText(enValue, locale);
    batch.push(
      existingMap.get(entryKey)
        ? {
            body: { key: item.key, locale, value: translatedText },
            headers: { 'content-type': 'application/json' },
            method: 'PATCH',
            url: `/api/collections/translations/records/${existingMap.get(entryKey).id}`
          }
        : {
            body: { key: item.key, locale, value: translatedText },
            headers: { 'content-type': 'application/json' },
            method: 'POST',
            url: '/api/collections/translations/records'
          }
    );
    return 1;
  } catch (e) {
    console.error(`\n  ❌ ${entryKey}: ${e.message}`);
    return -1;
  }
}

async function processItems(items, existingMap, checkpoint) {
  let translated = 0;
  let errors = 0;
  const batch = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const enValue = item.value;

    for (const locale of LOCALES) {
      const result = await processItemLocale(item, locale, enValue, existingMap, batch, checkpoint);
      if (result === 1) {
        translated++;
      } else if (result === -1) {
        errors++;
      }

      if (batch.length >= BATCH_SIZE) {
        await flushBatch(batch, checkpoint);
      }
    }

    process.stdout.write(`\r  [${i + 1}/${items.length}] key: ${item.key}`);
  }

  await flushBatch(batch, checkpoint);
  return { errors, translated };
}

async function flushBatch(batch, checkpoint) {
  if (batch.length === 0) {
    return;
  }
  await batchSend(batch);
  for (const b of batch) {
    checkpoint.add(`${b.body.key ? `${b.body.key}|${b.body.locale}` : `page:${b.body.page}|${b.body.language}`}`);
  }
  batch.length = 0;
  saveCheckpoint(checkpoint);
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 100));
}

async function main() {
  console.log(`🔤 Translating all content via ${LT_URL} → ${PB_URL}`);
  console.log(`   Locales: ${LOCALES.join(', ')}\n`);

  const checkpoint = loadCheckpoint();
  if (checkpoint.size > 0) {
    console.log(`📌 Checkpoint found — ${checkpoint.size} entries already completed, will resume\n`);
  }

  // Phase 1: Pages → pageVariants
  console.log('📄 Translating pages...');
  const pages = await fetchAllPages();
  const pageVariantsMap = await fetchAllPageVariants();
  console.log(`   ${pages.length} pages found, ${pageVariantsMap.size} existing variants\n`);

  const pageResult = await translatePages(pages, pageVariantsMap, checkpoint);

  // Phase 2: Translations collection
  console.log('\n🔑 Translating message keys...');
  const existingMap = await fetchAllRecords();
  console.log(`   ${existingMap.size} total translation records found\n`);

  const enKeys = extractEnKeys(existingMap);
  console.log(`   ${enKeys.size} English keys with values\n`);

  const sortedKeys = [...enKeys.keys()];
  const transResult = await processItems(
    sortedKeys.map((k) => ({ key: k, value: enKeys.get(k) })),
    existingMap,
    checkpoint
  );

  console.log(`\n✅ Pages: ${pageResult.translated} translated, ${pageResult.errors} errors`);
  console.log(`✅ Keys: ${transResult.translated} translated, ${transResult.errors} errors`);
}

await main();
