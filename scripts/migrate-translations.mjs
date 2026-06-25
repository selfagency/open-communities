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

const PB_URL = (process.env.PB_URL || 'http://localhost:8090').replace(/\/+$/, '');
const TOKEN = process.env.PB_API_TOKEN;
const MESSAGES_DIR = resolve(ROOT, process.env.MESSAGES_DIR || 'messages');
const BATCH_SIZE = 50; // PB batch limit

if (!TOKEN) {
  console.error('❌ PB_API_TOKEN is required');
  process.exit(1);
}

async function api(method, path, body) {
  const opts = { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${PB_URL}/api${path}`, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} — ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function batchSend(requests) {
  const res = await fetch(`${PB_URL}/api/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ requests })
  });
  if (!res.ok) {
    const text = await res.text();
    // If batch partially failed, log and continue
    console.error(`\n⚠  Batch failed (${res.status}): ${text.slice(0, 300)}`);
    // Fall back to individual requests for this batch
    for (const req of requests) {
      try {
        const r = await fetch(`${PB_URL}${req.url}`, {
          method: req.method,
          headers: { ...req.headers, authorization: `Bearer ${TOKEN}` },
          body: req.body ? JSON.stringify(req.body) : undefined
        });
        if (!r.ok) {
          const t = await r.text();
          // If it's a duplicate, skip silently
          if (t.includes('validation_not_unique')) continue;
          console.error(`    ⚠  ${req.method} ${req.url}: ${r.status} — ${t.slice(0, 100)}`);
        }
      } catch (e) {
        console.error(`    ⚠  ${req.method} ${req.url}: ${e.message}`);
      }
    }
  }
  return null;
}

async function main() {
  console.log(`📦 Migrating translations from ${MESSAGES_DIR} to ${PB_URL}...`);

  // Read all locale files
  const locales = ['en', 'de', 'es', 'fr', 'he', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'];
  const messages = {};

  for (const locale of locales) {
    const path = resolve(MESSAGES_DIR, `${locale}.json`);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const { $schema, ...keys } = raw;
      messages[locale] = keys;
      console.log(`  📖 ${locale}.json (${Object.keys(keys).length} keys)`);
    } catch {
      console.log(`  ⚠  ${locale}.json not found, skipping`);
      messages[locale] = {};
    }
  }

  // Collect all unique keys across all locales
  const allKeys = new Set();
  for (const locale of locales) {
    for (const key of Object.keys(messages[locale] || {})) {
      allKeys.add(key);
    }
  }

  console.log(`\n  🔑 ${allKeys.size} unique keys found`);

  // Fetch ALL existing translations (paginate)
  const existingMap = new Map(); // "key|locale" -> { id, value }
  let page = 1;
  while (true) {
    const existing = await api('GET', `/collections/translations/records?perPage=500&page=${page}`);
    for (const r of existing?.items ?? []) {
      existingMap.set(`${r.key}|${r.locale}`, { id: r.id, value: r.value });
    }
    if (!existing?.items?.length || existing.items.length < 500) break;
    page++;
  }

  console.log(`  📋 ${existingMap.size} existing records in PB`);

  // Build batch operations
  const batch = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const key of [...allKeys].sort()) {
    for (const locale of locales) {
      const value = messages[locale]?.[key];
      if (value === undefined || value === null) continue;

      const mapKey = `${key}|${locale}`;
      const existingEntry = existingMap.get(mapKey);

      if (existingEntry) {
        if (existingEntry.value === value) {
          skipped++;
          continue;
        }
        batch.push({
          method: 'PATCH',
          url: `/api/collections/translations/records/${existingEntry.id}`,
          body: { value },
          headers: { 'content-type': 'application/json' }
        });
        updated++;
      } else {
        batch.push({
          method: 'POST',
          url: '/api/collections/translations/records',
          body: { key, locale, value },
          headers: { 'content-type': 'application/json' }
        });
        created++;
      }

      // Flush batch when full
      if (batch.length >= BATCH_SIZE) {
        await batchSend(batch);
        batch.length = 0;
        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, 200)); // rate limit buffer
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await batchSend(batch);
    process.stdout.write('.');
  }

  console.log(`\n\n✅ Done — ${created} created, ${updated} updated, ${skipped} unchanged`);
}

await main();
