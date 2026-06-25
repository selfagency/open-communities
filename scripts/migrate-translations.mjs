#!/usr/bin/env node

/**
 * Migrates Paraglide message files (messages/{locale}.json) into the
 * PocketBase `translations` collection.
 *
 * Uses PB batch API to avoid rate limiting.
 *
 * Usage:
 *   PB_API_TOKEN=<token> PB_URL=<url> node scripts/migrate-translations.mjs
 *
 * Env:
 *   PB_API_TOKEN  — PocketBase admin API token (required)
 *   PB_URL        — PocketBase server URL (default: http://localhost:8090)
 *   MESSAGES_DIR  — input directory (default: messages/)
 */

import { readFileSync } from 'node:fs';
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
const BATCH_SIZE = 50; // PB batch limit

if (!TOKEN) {
  console.error('❌ PB_API_TOKEN is required');
  process.exit(1);
}

async function api(method, path, body) {
  const opts = { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` } };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${PB_URL}/api${path}`, opts);
  if (!res.ok) {
    throw new Error(`${method} ${path}: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function batchSend(requests) {
  const res = await fetch(`${PB_URL}/api/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ requests })
  });
  if (!res.ok) {
    console.error(`\n⚠  Batch failed (${res.status})`);
    await fallbackBatch(requests);
  }
  return null;
}

async function fallbackBatch(requests) {
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

function buildBatchEntry(key, locale, value, existingEntry) {
  if (existingEntry) {
    if (existingEntry.value === value) {
      return null;
    }
    return {
      method: 'PATCH',
      url: `/api/collections/translations/records/${existingEntry.id}`,
      body: { value },
      headers: { 'content-type': 'application/json' }
    };
  }
  return {
    method: 'POST',
    url: '/api/collections/translations/records',
    body: { key, locale, value },
    headers: { 'content-type': 'application/json' }
  };
}

async function flushBatch(batch, sent) {
  if (batch.length === 0) {
    return sent;
  }
  await batchSend(batch);
  batch.length = 0;
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 200));
  return sent;
}

async function buildBatchOps(messages, locales, allKeys, existingMap) {
  const batch = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b));
  for (const key of sortedKeys) {
    for (const locale of locales) {
      const localeMessages = messages.get(locale);
      const value = localeMessages ? localeMessages[key] : undefined;
      if (value === undefined || value === null) {
        continue;
      }

      const existingEntry = existingMap.get(`${key}|${locale}`);
      const entry = buildBatchEntry(key, locale, value, existingEntry);
      if (!entry) {
        skipped++;
        continue;
      }
      if (existingEntry) {
        updated++;
      } else {
        created++;
      }
      batch.push(entry);

      if (batch.length >= BATCH_SIZE) {
        await flushBatch(batch);
      }
    }
  }

  if (batch.length > 0) {
    await batchSend(batch);
  }
  return { created, updated, skipped };
}

async function main() {
  console.log(`📦 Migrating translations from ${MESSAGES_DIR} to ${PB_URL}...`);

  // Read all locale files
  const locales = ['en', 'de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];
  const messages = new Map();

  for (const locale of locales) {
    const path = resolve(MESSAGES_DIR, `${locale}.json`);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const { $schema, ...keys } = raw;
      messages.set(locale, keys);
      console.log(`  📖 ${locale}.json (${Object.keys(keys).length} keys)`);
    } catch {
      console.log(`  ⚠  ${locale}.json not found, skipping`);
      messages.set(locale, {});
    }
  }

  // Collect all unique keys across all locales
  const allKeys = new Set();
  for (const locale of locales) {
    for (const key of Object.keys(messages.get(locale) || {})) {
      allKeys.add(key);
    }
  }

  console.log(`\n  🔑 ${allKeys.size} unique keys found`);

  // Fetch ALL existing translations (paginate)
  const existingMap = new Map();
  let page = 1;
  while (true) {
    const existing = await api('GET', `/collections/translations/records?perPage=500&page=${page}`);
    for (const r of existing?.items ?? []) {
      existingMap.set(`${r.key}|${r.locale}`, { id: r.id, value: r.value });
    }
    if (!existing?.items?.length || existing.items.length < 500) {
      break;
    }
    page++;
  }

  console.log(`  📋 ${existingMap.size} existing records in PB`);

  const { created, updated, skipped } = await buildBatchOps(messages, locales, allKeys, existingMap);

  console.log(`\n\n✅ Done — ${created} created, ${updated} updated, ${skipped} unchanged`);
}

await main();
