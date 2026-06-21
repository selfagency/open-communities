#!/usr/bin/env node

/**
 * PocketBase bootstrap & seed script for E2E/testing environment.
 *
 * Usage:
 *   pnpm deps:up        # Start containers
 *   pnpm deps:bootstrap # Run this script
 *
 * Uses the PB installation token (from the startup URL) to authenticate
 * as superuser for schema import and data seeding.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '../..');

const PB_URL = process.env.PUBLIC_API_ENDPOINT || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const ADMIN_PASSWORD = process.env.PB_TEST_PASSWORD || 'i3_NL-dfzzFt5TX';
const SCHEMA_PATH = resolve(ROOT, 'pb_schema.json');
const CONTAINER = 'e2e-pocketbase-1';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function pbFetch(path, options = {}) {
  const url = `${PB_URL}/api${path}`;
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status >= 400) {
      console.warn(`  ⚠ PB ${options.method || 'GET'} ${path}: ${res.status} — ${text.slice(0, 150)}`);
    }
    return null;
  }
  return res.json();
}

function containerCmd(cmd) {
  return execSync(`docker exec ${CONTAINER} ${cmd}`, { encoding: 'utf8', timeout: 30000 }).trim();
}

/* ------------------------------------------------------------------ */
/*  1. Wait for PocketBase                                             */
/* ------------------------------------------------------------------ */

async function waitForPB() {
  console.log('⏳ Waiting for PocketBase...');
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${PB_URL}/api/health`);
      if (res.ok) {
        console.log('  ✅ PocketBase is healthy');
        return;
      }
    } catch {}
    await sleep(2000);
  }
  throw new Error('PocketBase did not become healthy within 120s');
}

/* ------------------------------------------------------------------ */
/*  2. Extract installation token from PB startup logs                 */
/* ------------------------------------------------------------------ */

function getInstallToken() {
  const logs = execSync(`docker logs ${CONTAINER} 2>&1`, { encoding: 'utf8' });
  const match = logs.match(/pbinstal\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (!match) throw new Error('Could not find installation token in PB logs');
  return match[1];
}

/* ------------------------------------------------------------------ */
/*  3. Import collections from schema                                  */
/* ------------------------------------------------------------------ */

async function importSchema(token) {
  console.log('📦 Importing collections...');
  if (!existsSync(SCHEMA_PATH)) {
    console.log('  ⚠ Schema file not found at', SCHEMA_PATH);
    return;
  }
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

  // Import via PUT /api/collections/import
  const result = await pbFetch('/collections/import', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ collections: schema, deleteMissing: false }),
  });

  if (result !== null) {
    console.log('  ✅ Collections imported');
  } else {
    // Fallback: create collections one by one
    console.log('  Trying individual collection creation...');
    for (const col of schema) {
      if (col.system) continue; // skip system collections
      const r = await pbFetch('/collections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(col),
      });
      if (r) console.log(`    ✅ ${col.name}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  4. Seed test data via REST API (with install token)                */
/* ------------------------------------------------------------------ */

async function seedData(token) {
  console.log('🌱 Seeding data...');

  function api(path, options = {}) {
    return pbFetch(path, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...options.headers },
    });
  }

  // Check if already seeded
  try {
    const existing = await api('/collections/users/records?filter=email%3D%22regular%40example.test%22');
    if (existing?.items?.length > 0) {
      console.log('  ⏭  Data already seeded, skipping');
      return;
    }
  } catch {}

  // ── Countries ──
  const us = await api('/collections/countries/records', {
    method: 'POST',
    body: JSON.stringify({ name: 'United States', code: 'US', flag: '🇺🇸', longitude: -98.5795, latitude: 39.8283 }),
  });
  if (!us) { console.log('  ❌ Failed to create country'); return; }
  console.log('  ✅ Country');

  // ── States ──
  const states = {};
  for (const s of [
    { name: 'New York', code: 'NY' },
    { name: 'California', code: 'CA' },
  ]) {
    states[s.code] = await api('/collections/states/records', {
      method: 'POST',
      body: JSON.stringify({ ...s, country: us.id, longitude: 0, latitude: 0 }),
    });
  }
  console.log('  ✅ States');

  // ── Cities ──
  const cities = {};
  for (const c of [
    { key: 'NYC', name: 'New York City', state: 'NY' },
    { key: 'BKN', name: 'Brooklyn', state: 'NY' },
    { key: 'LA', name: 'Los Angeles', state: 'CA' },
    { key: 'SF', name: 'San Francisco', state: 'CA' },
  ]) {
    cities[c.key] = await api('/collections/cities/records', {
      method: 'POST',
      body: JSON.stringify({ name: c.name, state: states[c.state]?.id, country: us.id, longitude: 0, latitude: 0 }),
    });
  }
  console.log('  ✅ Cities');

  // ── Users ──
  const users = {};
  for (const u of [
    { key: 'regular', email: 'regular@example.test', name: 'Regular User' },
    { key: 'other', email: 'other@example.test', name: 'Other User' },
  ]) {
    users[u.key] = await api('/collections/users/records', {
      method: 'POST',
      body: JSON.stringify({ ...u, password: 'TestPass123!', passwordConfirm: 'TestPass123!', verified: true, admin: false, lang: 'en', emailVisibility: true }),
    });
  }
  console.log('  ✅ Users');

  // ── Child table helpers ──
  async function createChild(table, data) {
    return api(`/collections/${table}/records`, { method: 'POST', body: JSON.stringify(data) });
  }

  // ── Congregations ──
  const defs = [{
    name: 'Shalom Congregation', owner: 'regular', city: 'NYC',
    children: {
      accessibility: { online_liveCaptions: true, online_automatedCaptions: true, inPerson_eva: true, inPerson_asl: true, inPerson_adaAll: true, inPerson_adaSome: true },
      fit: { youngFamilies: true, youngAdults: true, seniors: true, singles: true, interfaith: true, lgbtq: true, beginners: true, families: true },
      health: { requiresVax: true, hasAirPurification: true },
      registration: { maxCapacity: 500 },
      security: { securityPresent: true, secureEntry: true, cctv: true, guards: true, emergencyPlan: true },
      services: { fridayNight: true, saturdayMorning: true, holiday: true, hybrid: true, online: true, timeFridayNight: '18:30', timeSaturdayMorning: '09:30' },
    },
  }, {
    name: 'Private Minyan', owner: 'regular', city: 'BKN', visible: false,
    children: { services: { fridayNight: true, holiday: true } },
  }, {
    name: 'Other Community', owner: 'other', city: 'LA',
    children: { services: { saturdayMorning: true, holiday: true } },
  }, {
    name: 'Online Gathering', owner: 'regular', city: 'SF',
    children: {
      accessibility: { online_liveCaptions: true, online_automatedCaptions: true },
      fit: { interfaith: true, lgbtq: true },
      registration: { requiresRegistration: true },
      services: { fridayNight: true, hybrid: true, online: true, timeFridayNight: '19:00' },
    },
  }];

  for (const d of defs) {
    const city = cities[d.city];
    if (!city) continue;

    for (const [table, data] of Object.entries(d.children)) {
      if (Object.keys(data).length) await createChild(table, data);
    }

    await api('/collections/congregations/records', {
      method: 'POST',
      body: JSON.stringify({
        name: d.name, denomination: 'reform', visible: d.visible !== false,
        country: us.id, state: city.state, city: city.id,
        owner: users[d.owner]?.id,
      }),
    });
  }
  console.log('  ✅ Congregations');

  // ── Pages ──
  for (const p of [
    { title: 'About', slug: 'about', content: '# About\nDirectory.', published: true },
    { title: 'Privacy', slug: 'privacy', content: '# Privacy\nYour privacy matters.', published: true },
    { title: 'FAQ', slug: 'faq', content: '# FAQ\n## How do I add?\n\nClick the button.', published: true },
  ]) {
    await api('/collections/pages/records', { method: 'POST', body: JSON.stringify(p) });
  }
  console.log('  ✅ Pages');

  console.log('  ✅ Seed complete');
}

/* ------------------------------------------------------------------ */
/*  5. Create superuser via CLI (for admin panel access)               */
/* ------------------------------------------------------------------ */

function createAdmin() {
  console.log('👤 Creating superuser...');
  try {
    const result = containerCmd(`/pb/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"`);
    if (result.includes('Successfully')) {
      console.log('  ✅ Superuser created');
    }
  } catch (err) {
    console.error('  ❌ Failed:', err.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  PocketBase Bootstrap Script');
  console.log('═══════════════════════════════════════\n');

  const start = Date.now();

  try {
    await waitForPB();

    const token = getInstallToken();
    console.log('  🔑 Installation token acquired');

    await importSchema(token);
    await seedData(token);
    createAdmin();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Bootstrap complete in ${elapsed}s`);
    console.log(`   Admin panel: ${PB_URL}/_/`);
    console.log(`   Email:        ${ADMIN_EMAIL}`);
    console.log(`   Password:     ${ADMIN_PASSWORD}`);
  } catch (err) {
    console.error('\n❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

main();
