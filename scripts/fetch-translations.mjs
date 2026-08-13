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
 *   CI             — if set to 'true', abort loudly on fetch failure
 */

import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
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
const IS_CI = process.env.CI === 'true';

// Debug logging
console.log('[fetch-translations] DEBUG:');
console.log(`  CI env: "${process.env.CI}"`);
console.log(`  IS_CI detected: ${IS_CI}`);
console.log(`  TOKEN: ${TOKEN ? '✓ SET' : '✗ UNSET'}`);
console.log(`  PB_URL: ${PB_URL}`);
console.log(`  MESSAGES_DIR: ${MESSAGES_DIR}`);

function existingFilesHaveContent() {
  if (!existsSync(MESSAGES_DIR)) {
    return false;
  }
  const knownLocales = ['en', 'de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];
  for (const locale of knownLocales) {
    const path = resolve(MESSAGES_DIR, `${locale}.json`);
    if (existsSync(path)) {
      const stat = statSync(path);
      if (stat.size > 5) {
        return true;
      }
    }
  }
  return false;
}

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
  const all = [];
  let pageParam = 1;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    for (let guard = 0; guard < 100; guard += 1) {
      const res = await fetch(`${PB_URL}/api/collections/translations/records?perPage=500&page=${pageParam}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const items = data?.items ?? [];
      all.push(...items);
      const total = data?.totalItems ?? all.length;
      if (items.length === 0 || all.length >= total) {
        break;
      }
      pageParam += 1;
    }
    return all;
  } finally {
    clearTimeout(timeout);
  }
}

function groupByLocale(records) {
  const byLocale = new Map();
  for (const r of records) {
    const { locale } = r;
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
      writeFileSync(path, `${JSON.stringify(pbEntries, null, 2)}\n`);
      console.log(`  ✅ ${locale}.json (${Object.keys(pbEntries).length} keys)`);
    }
  } else {
    console.log('  ⚠  No translations found');
    if (existingFilesHaveContent()) {
      console.log('  Preserving existing message files');
    } else {
      console.log('  Writing empty message files (first-time setup)');
      writeFallbackFiles();
    }
  }
  return locales;
}

async function main() {
  console.log(`📦 Fetching translations from ${PB_URL}...`);
  let records;
  try {
    records = await fetchRecords();
  } catch (err) {
    const errorMsg = `Fetch failed (${err.cause?.code || err.message || err})`;
    console.error(`❌ ${errorMsg}`);

    if (IS_CI) {
      console.error('\n   Build type: CI (GitHub Actions rebuild)');
      console.error(`   Target: ${PB_URL}`);
      console.error('\n   Action: Aborting build. User can see error and retry.');
      process.exit(1);
    }

    if (existingFilesHaveContent()) {
      console.warn('⚠  Using existing message files (dev mode, may be stale)');
      process.exit(0);
    }
    console.warn('⚠  Writing fallback empty message files (dev mode)');
    writeFallbackFiles();
    process.exit(0);
  }

  if (records.length === 0) {
    console.error('❌ No translations found in PB');
    if (IS_CI) {
      console.error('\n   Action: Aborting build. Seed translations in PB and retry.');
      process.exit(1);
    }
    if (existingFilesHaveContent()) {
      console.warn('⚠  Using existing message files (dev mode)');
      process.exit(0);
    }
    console.warn('⚠  Writing empty fallback (dev mode)');
    writeFallbackFiles();
    process.exit(0);
  }

  const byLocale = groupByLocale(records);
  const locales = writeMessageFiles(byLocale);
  console.log(`\n✅ Done — ${locales.length} locales synced from PB`);
}

await main();
