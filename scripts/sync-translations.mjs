#!/usr/bin/env node

/**
 * Ensures the production PocketBase `translations` collection contains every
 * paraglide message key the codebase references. Scans `src/` for `m.<key>()`
 * usages, unions with `messages/en.json` (the compiled superset + source of
 * seed values), diffs against existing PB records per locale, and inserts any
 * missing keys with an English placeholder value.
 *
 * This makes the Docker build self-healing: commit `d49f0907` switched
 * `fetch-translations.mjs` to a clean DB overwrite (no merge with committed
 * files), so any key present in code but absent from production PB causes a
 * missing paraglide message function → `TypeError: (void 0) is not a function`
 * during SSR → every request returns 500 → E2E "Wait for app" times out.
 * Running this before fetch-translations guarantees PB is a complete superset.
 *
 * Usage:
 *   PB_API_TOKEN=<token> PB_URL=<url> node scripts/sync-translations.mjs
 *   PB_API_TOKEN=<token> node scripts/sync-translations.mjs --dry-run
 *   node scripts/sync-translations.mjs --scan          # audit only, no PB access
 *
 * Env:
 *   PB_API_TOKEN  — PocketBase admin API token (required for PB access;
 *                   when unset the script no-ops, mirroring fetch-translations)
 *   PB_URL        — PocketBase server URL (default: http://localhost:8090)
 *   MESSAGES_DIR  — message source dir (default: messages/)
 *   LOCALES       — comma-separated locale override. When set, exactly these
 *                   locales are seeded regardless of --include-non-en.
 *                   (default: only 'en'; auto-detect from PB with --include-non-en)
 *   DRY_RUN       — 'true' to preview without writing
 *
 * Flags:
 *   --dry-run           preview changes without writing to PB
 *   --include-non-en    also seed missing keys for non-English locales
 *                        (default: only 'en' — paraglide falls back to en at runtime)
 *   --scan              print the required key set derived from code + en.json, then
 *                   exit (no PB access, no token needed)
 *
 * The script only ever INSERTS missing records. It never modifies or deletes
 * existing translations — human/MT translations are always preserved.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '..');

const PB_URL = (process.env.PB_URL || 'http://localhost:8090').replace(/\/$/, '');
const TOKEN = process.env.PB_API_TOKEN;
const MESSAGES_DIR = resolve(ROOT, process.env.MESSAGES_DIR || 'messages');
const SRC_DIR = resolve(ROOT, 'src');
const COLLECTION = 'translations';

const FLAGS = new Set(process.argv.slice(2));
const DRY_RUN = process.env.DRY_RUN === 'true' || FLAGS.has('--dry-run');
const INCLUDE_NON_EN = FLAGS.has('--include-non-en');
const SCAN_ONLY = FLAGS.has('--scan');
const LOCALES_ARG = process.env.LOCALES;

/* ─── code scanner ─────────────────────────────────────────────────────── */

const SOURCE_EXTS = ['.svelte', '.ts', '.js'];
// Skip generated/test dirs so the required set reflects production code only.
const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', 'paraglide', 'build', 'dist']);
const SKIP_SUFFIXES = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];

// Matches: import { m } | { m as mBase } | { languageTag, m } from '.../paraglide/messages'
const IMPORT_BLOCK_RE = /import\s*\{([^}]*)\}\s*from\s*['"][^'"]*paraglide\/messages['"]/;
// Matches: import * as m from '.../paraglide/messages'
const NAMESPACE_IMPORT_RE = /import\s*\*\s+as\s+([A-Za-z_$][\w$]*)\s*from\s*['"][^'"]*paraglide\/messages['"]/;
// Matches `m` (or `m as name`) inside an import block specifier list.
const PARAGLIDE_M_SPEC_RE = /\bm\b(?:\s+as\s+([A-Za-z_$][\w$]*))?/;

// Inlang metadata key ($schema) is not a real paraglide message — filter it out.
// PB's `key` field rejects non-alphanumeric characters like `$`.
const VALID_KEY_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      out.push(...walkSources(full));
    } else if (entry.isFile() && SOURCE_EXTS.some((e) => entry.name.endsWith(e))) {
      if (SKIP_SUFFIXES.some((s) => entry.name.endsWith(s))) {
        continue;
      }
      out.push(full);
    }
  }
  return out;
}

/** Find the local alias bound to the paraglide `m` namespace in a file. */
function paraglideAlias(src) {
  // Named import: { … m [as X] … }
  const block = src.match(IMPORT_BLOCK_RE);
  if (block) {
    const mSpec = block[1].match(PARAGLIDE_M_SPEC_RE);
    if (mSpec) {
      return mSpec[1] || 'm';
    }
  }
  // Namespace import: * as X
  const ns = src.match(NAMESPACE_IMPORT_RE);
  if (ns) {
    return ns[1];
  }
  return null;
}

function collectKeys(alias, src) {
  const keys = new Set();
  // \b anchor prevents matching the alias as a suffix of another identifier
  // (e.g. `form.set(` must NOT match alias `m`).
  const aliasRe = `\\b${escapeRe(alias)}`;
  // m.key(  or  mBase.key(
  const callRe = new RegExp(`${aliasRe}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g');
  // m["key"]  / m['key']  (dynamic literal access)
  const dynRe = new RegExp(`${aliasRe}\\[\\s*['"]([A-Za-z_$][\\w$]*)['"]\\s*\\]`, 'g');
  for (const match of src.matchAll(callRe)) {
    keys.add(match[1]);
  }
  for (const match of src.matchAll(dynRe)) {
    keys.add(match[1]);
  }
  return keys;
}

function scanCodeKeys() {
  const keys = new Set();
  let scanned = 0;
  for (const file of walkSources(SRC_DIR)) {
    const src = readFileSync(file, 'utf8');
    const alias = paraglideAlias(src);
    if (!alias) {
      continue;
    }
    scanned++;
    for (const k of collectKeys(alias, src)) {
      keys.add(k);
    }
  }
  return { keys, scanned };
}

/* ─── PocketBase access ────────────────────────────────────────────────── */

async function pbFetch(pathname, init = {}) {
  const res = await fetch(`${PB_URL}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers
    }
  });
  return res;
}

async function getCollectionSchema() {
  const res = await pbFetch(`/api/collections/${COLLECTION}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data?.schema ?? [];
}

async function fetchAllRecords() {
  const all = [];
  let page = 1;
  // Hard safety cap to avoid an infinite loop on a misbehaving API.
  for (let guard = 0; guard < 500; guard++) {
    const res = await pbFetch(`/api/collections/${COLLECTION}/records?perPage=500&page=${page}`);
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
    page++;
  }
  return all;
}

async function createRecord(record) {
  const res = await pbFetch(`/api/collections/${COLLECTION}/records`, {
    method: 'POST',
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/* ─── helpers ──────────────────────────────────────────────────────────── */

function loadEnValues() {
  try {
    return JSON.parse(readFileSync(join(MESSAGES_DIR, 'en.json'), 'utf8'));
  } catch {
    console.warn('⚠  Could not read messages/en.json — seed values will fall back to key names');
    return {};
  }
}

function groupByLocale(records) {
  const byLocale = new Map();
  for (const r of records) {
    if (!byLocale.has(r.locale)) {
      byLocale.set(r.locale, new Set());
    }
    byLocale.get(r.locale).add(r.key);
  }
  return byLocale;
}

function resolveTargetLocales(byLocale) {
  const explicit = LOCALES_ARG
    ? LOCALES_ARG.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  // LOCALES env var is an explicit override — honour it exactly.
  if (explicit) {
    return explicit;
  }
  // Auto-detect from existing PB records. Default: only seed `en` (the base
  // locale); other locales fall back to `en` at runtime via paraglide.
  // Pass --include-non-en to seed all detected locales.
  const detected = [...byLocale.keys()];
  const locales = detected.length ? detected : ['en'];
  return locales.filter((l) => INCLUDE_NON_EN || l === 'en');
}

function buildDiffPlan(locales, byLocale, required, enValues) {
  const plan = [];
  for (const locale of locales) {
    const existing = byLocale.get(locale) ?? new Set();
    for (const key of required) {
      if (existing.has(key)) {
        continue;
      }
      plan.push({ key, locale, value: enValues[key] ?? key });
    }
  }
  return plan;
}

function summarizeByLocale(plan) {
  const counts = new Map();
  for (const item of plan) {
    counts.set(item.locale, (counts.get(item.locale) ?? 0) + 1);
  }
  return counts;
}

function printPlanSummary(plan) {
  const counts = summarizeByLocale(plan);
  console.log(`\n📊 missing records: ${plan.length} across ${counts.size} locale(s)`);
  for (const [locale, n] of [...counts.entries()].sort()) {
    const sample = plan
      .filter((p) => p.locale === locale)
      .slice(0, 6)
      .map((p) => p.key)
      .join(', ');
    console.log(`   ${locale}: ${n} (${sample}${n > 6 ? ', …' : ''})`);
  }
}

function printRequiredSet(required) {
  console.log(`\n🔍 --scan: required keys (${required.size}):`);
  console.log(`   ${[...required].sort().join(', ')}`);
}

function buildRequiredSet() {
  const { keys: codeKeys, scanned } = scanCodeKeys();
  const enValues = loadEnValues();
  const enKeys = new Set(Object.keys(enValues));
  let required = new Set([...codeKeys, ...enKeys]);

  // Filter out keys that would fail PB's `key` field validation (e.g. Inlang
  // metadata like `$schema` — the `$` prefix is not an allowed character).
  // Real paraglide message keys are always alphanumeric with underscores.
  const filtered = [...required].filter((k) => VALID_KEY_RE.test(k));
  for (const k of required) {
    if (!VALID_KEY_RE.test(k)) {
      console.warn(`  ⚠  skipping invalid key '${k}' (not a valid PB field value)`);
    }
  }
  required = new Set(filtered);

  console.log(`  📝 scanned ${scanned} files importing paraglide → ${codeKeys.size} distinct keys in code`);
  console.log(`  📦 messages/en.json → ${enKeys.size} keys`);
  console.log(`  ✅ required set (union, PB-valid) → ${required.size} keys`);

  for (const k of codeKeys) {
    if (!enKeys.has(k)) {
      console.warn(`  ⚠  '${k}' used in code but absent from en.json — will seed key name as value`);
    }
  }

  return { required, enValues };
}

async function fetchProductionRecords() {
  await getCollectionSchema(); // smoke-test auth + collection existence
  return fetchAllRecords();
}

async function createRecords(plan) {
  console.log(`\n➕ creating ${plan.length} records…`);
  let created = 0;
  let failed = 0;
  for (const item of plan) {
    try {
      await createRecord({ key: item.key, locale: item.locale, value: item.value });
      created++;
    } catch (err) {
      // PB returns 400 with "UNIQUE constraint" when the record already exists
      // (e.g. from a previous CI run that partially succeeded). Treat as success.
      if (err.message.includes('400') && err.message.includes('UNIQUE')) {
        created++;
        continue;
      }
      failed++;
      console.error(`   ❌ ${item.locale}/${item.key}: ${err.message}`);
    }
  }
  return { created, failed };
}

/* ─── main ─────────────────────────────────────────────────────────────── */

async function main() {
  console.log(`🔁 sync-translations → ${PB_URL}`);

  // 1. Required keys: code scan ∪ messages/en.json
  const { required, enValues } = buildRequiredSet();

  if (SCAN_ONLY) {
    printRequiredSet(required);
    process.exit(0);
  }

  if (!TOKEN) {
    console.warn('\n⚠  PB_API_TOKEN not set — skipping production sync (local build no-op)');
    process.exit(0);
  }

  // 2. Read production PB
  let records;
  try {
    records = await fetchProductionRecords();
  } catch (err) {
    console.error(`\n❌ Cannot read production PB '${COLLECTION}': ${err.message}`);
    console.error('   Check PB_API_TOKEN, PB_URL, and that the collection exists.');
    process.exit(1);
  }

  // 3. Group + diff
  const byLocale = groupByLocale(records);
  const locales = resolveTargetLocales(byLocale);
  console.log(`  🌐 locales to sync: ${locales.join(', ') || '(none after --en-only)'}`);

  const plan = buildDiffPlan(locales, byLocale, required, enValues);

  if (plan.length === 0) {
    console.log('\n✅ All required keys already present in production PB. Nothing to add.');
    process.exit(0);
  }

  printPlanSummary(plan);

  if (DRY_RUN) {
    console.log('\n👁  DRY RUN — no records written. Re-run without --dry-run to apply.');
    process.exit(0);
  }

  // 4. Create missing records
  const { created, failed } = await createRecords(plan);

  if (failed > 0) {
    console.error(`\n⚠️  Done — created ${created}, FAILED ${failed}. Review errors above.`);
    process.exit(1);
  }
  console.log(`\n✅ Done — created ${created} record(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 sync-translations crashed:', err);
  process.exit(1);
});
