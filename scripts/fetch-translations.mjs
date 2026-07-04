#!/usr/bin/env node

/**
 * Fetches translations from PocketBase and writes messages/{locale}.json files
 * for Paraglide to compile at build time.
 *
 * Usage:
 *   PB_API_TOKEN=<token> PB_URL=<url> node scripts/fetch-translations.mjs
 *
 * Env:
 *   PB_API_TOKEN  — PocketBase admin API token (required)
 *   PB_URL        — PocketBase server URL (default: http://localhost:8090)
 *   MESSAGES_DIR  — output directory (default: messages/)
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '..');

let PB_URL = process.env.PB_URL || 'http://localhost:8090';
if (PB_URL.endsWith('/')) {
  PB_URL = PB_URL.slice(0, -1);
}
const TOKEN = process.env.PB_API_TOKEN;
const MESSAGES_DIR = resolve(ROOT, process.env.MESSAGES_DIR || 'messages');

function writeFallbackFiles() {
  const knownLocales = ['en', 'de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];
  if (!existsSync(MESSAGES_DIR)) {
    mkdirSync(MESSAGES_DIR, { recursive: true });
  }
  for (const locale of knownLocales) {
    writeFileSync(resolve(MESSAGES_DIR, `${locale}.json`), '{}\n');
  }
}

if (!TOKEN) {
  if (existsSync(MESSAGES_DIR)) {
    console.warn('⚠  PB_API_TOKEN not set — local message files preserved, skipping fetch');
    process.exit(0);
  }
  console.warn('⚠  PB_API_TOKEN not set — writing empty message files');
  writeFallbackFiles();
  process.exit(0);
}

async function fetchRecords() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${PB_URL}/api/collections/translations/records?perPage=1000`, {
      headers: { authorization: `Bearer ${TOKEN}` },
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch translations: ${res.status}`);
    }
    const data = await res.json();
    return data?.items ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

function groupByLocale(records) {
  const byLocale = new Map();
  for (const r of records) {
    const locale = r.locale;
    if (!byLocale.has(locale)) {
      byLocale.set(locale, {});
    }
    const map = byLocale.get(locale);
    map[/** @type {string} */ (r.key)] = r.value;
  }
  return byLocale;
}

function writeMessageFiles(byLocale) {
  if (!existsSync(MESSAGES_DIR)) {
    mkdirSync(MESSAGES_DIR, { recursive: true });
  }
  const locales = [...byLocale.keys()];
  if (locales.length > 0) {
    for (const locale of locales) {
      const path = resolve(MESSAGES_DIR, `${locale}.json`);
      const pbEntries = byLocale.get(locale);
      // Clean overwrite from PB — no merge with existing file.
      // The DB is the source of truth; stale local-only keys must not persist.
      writeFileSync(path, `${JSON.stringify(pbEntries, null, 2)}\n`);
      console.log(`  ✅ ${locale}.json (${Object.keys(pbEntries).length} keys)`);
    }
  } else {
    console.log('  ⚠  No translations found — writing empty message files');
    writeFallbackFiles();
  }
  return locales;
}

async function main() {
  console.log(`📦 Fetching translations from ${PB_URL}...`);
  let records;
  try {
    records = await fetchRecords();
  } catch (err) {
    console.warn(`⚠  Fetch failed (${err?.cause?.code || err?.message || err}) — writing fallback files`);
    writeFallbackFiles();
    process.exit(0);
  }
  if (records.length === 0) {
    console.log('  ⚠  No translations found — writing empty files');
  }
  const byLocale = groupByLocale(records);
  const locales = writeMessageFiles(byLocale);
  console.log(`\n✅ Done — ${locales.length || '11'} locales synced`);
}

await main();
