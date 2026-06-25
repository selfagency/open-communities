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

const PB_URL = (process.env.PB_URL || 'http://localhost:8090').replace(/\/+$/, '');
const TOKEN = process.env.PB_API_TOKEN;
const MESSAGES_DIR = resolve(ROOT, process.env.MESSAGES_DIR || 'messages');

if (!TOKEN) {
  console.error('❌ PB_API_TOKEN is required');
  process.exit(1);
}

async function main() {
  console.log(`📦 Fetching translations from ${PB_URL}...`);

  // Fetch all translations
  const res = await fetch(`${PB_URL}/api/collections/translations/records?perPage=1000`, {
    headers: { authorization: `Bearer ${TOKEN}` }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch translations: ${res.status} — ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const records = data?.items ?? [];

  if (records.length === 0) {
    console.log('  ⚠  No translations found — writing empty message files');
  }

  // Group by locale
  const byLocale = {};
  for (const r of records) {
    const locale = r.locale;
    if (!byLocale[locale]) byLocale[locale] = {};
    byLocale[locale][r.key] = r.value;
  }

  // Ensure messages directory exists
  if (!existsSync(MESSAGES_DIR)) {
    mkdirSync(MESSAGES_DIR, { recursive: true });
  }

  // Write one JSON file per locale
  const locales = Object.keys(byLocale);
  for (const locale of locales) {
    const path = resolve(MESSAGES_DIR, `${locale}.json`);
    writeFileSync(path, JSON.stringify(byLocale[locale], null, 2) + '\n');
    console.log(`  ✅ ${locale}.json (${Object.keys(byLocale[locale]).length} keys)`);
  }

  // If no locales were found, write empty files for all known locales
  // so Paraglide doesn't fail on missing files
  if (locales.length === 0) {
    const knownLocales = ['en', 'de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];
    for (const locale of knownLocales) {
      const path = resolve(MESSAGES_DIR, `${locale}.json`);
      writeFileSync(path, '{}\n');
      console.log(`  ⚠  ${locale}.json (empty)`);
    }
  }

  console.log(`\n✅ Done — ${records.length} translations across ${locales.length || '11'} locales`);
}

await main();
