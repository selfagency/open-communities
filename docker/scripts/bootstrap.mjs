#!/usr/bin/env node

/**
 * PocketBase bootstrap & seed script for E2E/testing environment.
 *
 * Usage:
 *   pnpm deps:up
 *   pnpm deps:bootstrap
 *
 * Uses PB's installation token from startup URL for superuser API access.
 * Imports schema from pb_schema.json, seeds test data, creates admin.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(DIR, '../..');
const PB = process.env.PUBLIC_API_ENDPOINT || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.PB_TEST_ADMIN || 'admin@test.com';
const ADMIN_PASSWORD = process.env.PB_TEST_PASSWORD || process.env.PB_TEST_PASSWORD_FALLBACK || 'i3_NL-dfzzFt5TX'; // NOSONAR — test fixture fallback
const CONTAINER = 'docker-pocketbase-1';
const SCHEMA_PATH = resolve(ROOT, 'pb_schema.json');

/* ── Helpers ── */

async function api(method, path, body, token) {
  const opts = { method, headers: { 'content-type': 'application/json' } };
  if (token) opts.headers['authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${PB}/api${path}`, opts);
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* ── Steps ── */

async function waitForPB() {
  process.stdout.write('⏳ Waiting for PocketBase...');
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${PB}/api/health`)).ok) { console.log(' ✅'); return; } } catch {}
    await sleep(2000);
  }
  throw new Error('PB did not become healthy within 120s');
}

async function getToken() {
  // First try: authenticate as existing admin (works when PB already has a superuser)
  try {
    const res = await fetch(`${PB}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('  🔑 Authenticated as existing admin');
      return data.token;
    }
  } catch { /* fall through */ }

  // Second try: create superuser via docker exec (works when PB has data but no superuser yet)
  try {
    execSync(`docker exec ${CONTAINER} /pb/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" --dir=/pb_data 2>/dev/null`, { encoding: 'utf8', timeout: 15000 });
    const res = await fetch(`${PB}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('  🔑 Created superuser and authenticated');
      return data.token;
    }
  } catch { /* fall through */ }

  // Third try: extract installation token from startup logs (fresh PB)
  for (let attempt = 0; attempt < 10; attempt++) {
    let logs;
    try {
      logs = execSync(`docker logs ${CONTAINER} 2>&1`, { encoding: 'utf8', timeout: 10000 });
    } catch {
      const fs = await import('node:fs');
      logs = fs.readFileSync('.docker/pb.log', 'utf8');
    }
    const m = logs.match(/pbinstal\/(\S+)/);
    if (m) {
      console.log('  🔑 Installation token acquired');
      return m[1];
    }
    await sleep(1000);
  }
  throw new Error('No installation token found — start PB fresh');
}

async function verifyToken(token) {
  try {
    const res = await fetch(`${PB}/api/collections?perPage=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Token rejected: ${res.status}`);
    const data = await res.json();
    if (!data?.items) throw new Error('Unexpected response shape');
    console.log('  🔑 Token verified');
    return true;
  } catch (err) {
    throw new Error(`Installation token is invalid: ${err.message}`);
  }
}

async function importSchema(token) {
  console.log('📦 Importing schema...');
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

  const res = await fetch(`${PB}/api/collections/import`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ collections: schema, deleteMissing: false }),
  });
  if (!res.ok) {
    throw new Error(`Schema import failed: ${res.status}`);
  }
  console.log('  ✅ Collections imported');
}

async function configureSMTP(token) {
  console.log('📧 Configuring SMTP...');
  try {
    const res = await fetch(`${PB}/api/settings`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        smtp: {
          enabled: true,
          host: 'mailpit',
          port: 1025,
          authMethod: '',
          tls: false
        }
      })
    });
    if (!res.ok) {
      throw new Error(`SMTP config failed: ${res.status}`);
    }
    console.log('  ✅ SMTP configured (Mailpit)');
  } catch (err) {
    console.log(`  ⚠  SMTP config skipped: ${err.message}`);
  }
}

async function seedData(token) {
  console.log('🌱 Seeding data...');

  const existing = await api('GET', `/collections/users/records?filter=${encodeURIComponent('email="regular@example.test"')}`, null, token);
  const adminFilter = 'email="' + ADMIN_EMAIL + '"';
  const adminExists = await api('GET', `/collections/users/records?filter=${encodeURIComponent(adminFilter)}`, null, token);

  // Always ensure admin user exists (may have been created by a different bootstrap version)
  if (!adminExists?.items?.length) {
    await create('users', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, passwordConfirm: ADMIN_PASSWORD, name: 'Admin User', verified: true, admin: true, lang: 'en', emailVisibility: true });
  }

  if (existing?.items?.length > 0) {
    console.log('  ⏭  Already seeded');
    return;
  }

  async function create(col, data) {
    const r = await api('POST', `/collections/${col}/records`, data, token);
    console.log(`    ✅ ${col}: ${r?.id?.slice(0, 8)}...`); // NOSONAR — record IDs, not user data
    return r;
  }

  // Countries
  const us = await create('countries', { name: 'United States', code: 'US', flag: '🇺🇸', longitude: -98.5795, latitude: 39.8283 });

  // States
  const ny = await create('states', { name: 'New York', code: 'NY', country: us.id, longitude: -74.006, latitude: 40.7128 });
  const ca = await create('states', { name: 'California', code: 'CA', country: us.id, longitude: -119.6816, latitude: 36.1162 });

  // Cities
  const nyc = await create('cities', { name: 'New York City', state: ny.id, country: us.id, longitude: -74.006, latitude: 40.7128 });
  const bkn = await create('cities', { name: 'Brooklyn', state: ny.id, country: us.id, longitude: -73.9442, latitude: 40.6782 });
  const la  = await create('cities', { name: 'Los Angeles', state: ca.id, country: us.id, longitude: -118.2437, latitude: 34.0522 });

  // Users (password will be hashed by PB automatically)
  const regular = await create('users', { email: 'regular@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Regular User', verified: true, lang: 'en', emailVisibility: true }); // NOSONAR — test fixture
  const other = await create('users', { email: 'other@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Other User', verified: true, lang: 'en', emailVisibility: true }); // NOSONAR — test fixture

  // Congregation 1: visible, owned by regular user, full featured
  const cong1 = await create('congregations', { name: 'Shalom Congregation', clergy: 'rabbi', denomination: 'reform', flavor: 'egalitarian', notes: 'A welcoming Reform community', contactName: 'Rabbi Cohen', contactEmail: 'info@shalom.org', contactUrl: 'https://shalom.org', country: us.id, state: ny.id, city: nyc.id, visible: true, owner: regular.id });
  await create('accessibility', { congregation: cong1.id, online_liveCaptions: true, online_automatedCaptions: true, inPerson_eva: true, inPerson_asl: true, inPerson_adaAll: true, inPerson_adaSome: true });
  await create('fit', { congregation: cong1.id, youngFamilies: true, youngAdults: true, seniors: true, singles: true, interfaith: true, lgbtq: true, beginners: true, families: true });
  await create('health', { congregation: cong1.id, requiresVax: true, hasAirPurification: true });
  await create('registration', { congregation: cong1.id, maxCapacity: 500 });
  await create('security', { congregation: cong1.id, securityPresent: true, secureEntry: true, cctv: true, guards: true, emergencyPlan: true });
  await create('services', { congregation: cong1.id, fridayNight: true, saturdayMorning: true, holiday: true, hybrid: true, online: true, timeFridayNight: '18:30', timeSaturdayMorning: '09:30' });

  // Congregation 2: hidden
  const cong2 = await create('congregations', { name: 'Private Minyan', clergy: 'lay-led', denomination: 'conservative', flavor: 'traditional', contactName: 'Private Member', contactEmail: 'private@example.test', country: us.id, state: ny.id, city: bkn.id, visible: false, owner: regular.id });
  await create('services', { congregation: cong2.id, fridayNight: true, holiday: true });

  // Congregation 3: owned by other user
  const cong3 = await create('congregations', { name: 'Other Community', clergy: 'rabbi', denomination: 'orthodox', flavor: 'modern', contactName: 'Other Rabbi', contactEmail: 'other@example.test', country: us.id, state: ca.id, city: la.id, visible: true, owner: other.id });
  await create('services', { congregation: cong3.id, saturdayMorning: true, holiday: true });

  // Congregation 4: online-only
  const cong4 = await create('congregations', { name: 'Online Gathering', clergy: '', denomination: 'reconstructionist', flavor: 'online', notes: 'Zoom-based community', contactName: 'Online Group', contactEmail: 'online@example.test', contactUrl: 'https://online.example.test', country: us.id, state: ca.id, city: la.id, visible: true, owner: regular.id });
  await create('accessibility', { congregation: cong4.id, online_liveCaptions: true, online_automatedCaptions: true });
  await create('fit', { congregation: cong4.id, interfaith: true, lgbtq: true });
  await create('registration', { congregation: cong4.id, requiresRegistration: true });
  await create('services', { congregation: cong4.id, fridayNight: true, hybrid: true, online: true, timeFridayNight: '19:00' });

  // Pages
  await create('pages', { title: 'About', slug: 'about', lang: 'en', content: '# About\n\nDirectory of Jewish congregations.', published: true });
  await create('pages', { title: 'Privacy', slug: 'privacy', lang: 'en', content: '# Privacy Policy\n\nYour privacy matters.', published: true });
  await create('pages', { title: 'FAQ', slug: 'frequently-asked-questions', lang: 'en', content: '# FAQ\n\nClick "Add Congregation".', published: true });
}

async function main() {
  console.log('═══════════════════════════════════════\n  PocketBase Bootstrap\n═══════════════════════════════════════\n');
  const start = Date.now();
  try {
    await waitForPB();
    const token = await getToken();
    await verifyToken(token);
    await importSchema(token);
    await configureSMTP(token);
    await seedData(token);
    // Create superuser for admin panel access (Docker exec, not needed for token)
    try {
      execSync(`docker exec ${CONTAINER} /pb/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" --dir=/pb_data`, { encoding: 'utf8', timeout: 15000 });
      console.log('  👤 Superuser created');
    } catch {
      console.log('  ⏭  Superuser creation skipped (CI or container name mismatch)');
    }
    console.log(`\n✅ Done in ${((Date.now()-start)/1000).toFixed(1)}s`);
    console.log(`   Panel: ${PB}/_/`);
    console.log(`   Auth:  ${ADMIN_EMAIL}`);
  } catch (e) {
    console.error('\n❌', e.message);
    process.exit(1);
  }
}

await main();
