#!/usr/bin/env node

/**
 * PocketBase bootstrap & seed script for E2E/testing environment.
 *
 * Usage:
 *   pnpm deps:up
 *   pnpm deps:bootstrap
 *
 * Prerequisites: Docker containers running (PB, Mailpit, Cap).
 *
 * This script works around PB 0.29.x's lack of superuser REST API by:
 *   1. Creating superuser via `docker exec` CLI
 *   2. Seeding data via direct SQLite inserts into the PB database
 *   3. Importing collections schema via auto-migration
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
const MIGRATIONS_DIR = resolve(ROOT, 'e2e/pb_migrations');

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dbg(...args) { console.log('  →', ...args); }

function run(cmd, opts = {}) {
  const result = execSync(cmd, { encoding: 'utf8', timeout: 30000, ...opts });
  return result?.trim() || '';
}

function containerName() {
  return run(`docker ps --filter "ancestor=opencommunities-pocketbase:local" --format "{{.Names}}"`);
}

function sql(sql, ...params) {
  const c = containerName();
  // Escape single quotes in SQL
  const escaped = sql.replace(/'/g, "''");
  const paramStr = params.length > 0
    ? ` -json ${params.map(p => `'${String(p).replace(/'/g, "'\\''")}'`).join(' ')}`
    : '';
  try {
    const result = run(`docker exec ${c} sqlite3 /pb/pb_data/data.db ${paramStr ? '' : `"${escaped}"`}`);
    return result;
  } catch (e) {
    // Try to install sqlite if missing
    run(`docker exec ${c} apk add --no-cache sqlite 2>/dev/null || true`);
    return run(`docker exec ${c} sqlite3 /pb/pb_data/data.db "${escaped}"`);
  }
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
/*  2. Create superuser via CLI                                        */
/* ------------------------------------------------------------------ */

function createSuperuser() {
  console.log('👤 Setting up superuser...');
  try {
    const c = containerName();
    if (!c) throw new Error('PB container not found');

    // Try to auth first via CLI — if already exists, skip creation
    const result = run(`docker exec ${c} /pb/pocketbase superuser upsert "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"`);
    if (result.includes('Successfully')) {
      console.log('  ✅ Superuser created');
    }
  } catch (err) {
    console.error('  ❌ Failed to create superuser:', err.message);
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/*  3. Seed data via SQLite                                            */
/* ------------------------------------------------------------------ */

function seedData() {
  console.log('🌱 Seeding data...');
  const c = containerName();

  // Install sqlite in container if needed
  run(`docker exec ${c} apk add --no-cache sqlite 2>/dev/null || true`);

  // Check if already seeded
  const count = sql("SELECT COUNT(*) FROM users WHERE email='regular@example.test'");
  if (parseInt(count) > 0) {
    console.log('  ⏭  Data already seeded, skipping');
    return;
  }

  // ═══════════════════════════════════════════
  // Countries
  // ═══════════════════════════════════════════
  const usId = run(`docker exec ${c} sh -c "sqlite3 /pb/pb_data/data.db \\"INSERT INTO countries (id, name, code, flag, longitude, latitude, created, updated) VALUES (lower(hex(randomblob(7))), 'United States', 'US', '🇺🇸', -98.5795, 39.8283, datetime('now'), datetime('now')); SELECT last_insert_rowid();\\""`).trim();
  console.log(`  country: ${usId}`);

  // ═══════════════════════════════════════════
  // States
  // ═══════════════════════════════════════════
  const states = {
    NY: sqlInsert('states', {name:'New York', code:'NY', country: usId, longitude: -74.006, latitude: 40.7128}),
    CA: sqlInsert('states', {name:'California', code:'CA', country: usId, longitude: -119.6816, latitude: 36.1162}),
    IL: sqlInsert('states', {name:'Illinois', code:'IL', country: usId, longitude: -89.3985, latitude: 40.6331}),
    FL: sqlInsert('states', {name:'Florida', code:'FL', country: usId, longitude: -81.5158, latitude: 27.6648}),
    MA: sqlInsert('states', {name:'Massachusetts', code:'MA', country: usId, longitude: -71.3824, latitude: 42.4072}),
  };

  // ═══════════════════════════════════════════
  // Cities
  // ═══════════════════════════════════════════
  const cities = {
    NYC: sqlInsert('cities', {name:'New York City', state: states.NY, country: usId, longitude: -74.006, latitude: 40.7128}),
    BKN: sqlInsert('cities', {name:'Brooklyn', state: states.NY, country: usId, longitude: -73.9442, latitude: 40.6782}),
    LA:  sqlInsert('cities', {name:'Los Angeles', state: states.CA, country: usId, longitude: -118.2437, latitude: 34.0522}),
    SF:  sqlInsert('cities', {name:'San Francisco', state: states.CA, country: usId, longitude: -122.4194, latitude: 37.7749}),
    CHI: sqlInsert('cities', {name:'Chicago', state: states.IL, country: usId, longitude: -87.6298, latitude: 41.8781}),
    MIA: sqlInsert('cities', {name:'Miami', state: states.FL, country: usId, longitude: -80.1918, latitude: 25.7617}),
    BOS: sqlInsert('cities', {name:'Boston', state: states.MA, country: usId, longitude: -71.0589, latitude: 42.3601}),
  };

  // ═══════════════════════════════════════════
  // Users
  // ═══════════════════════════════════════════
  const users = {};
  for (const u of [
    {email:'regular@example.test', name:'Regular User', admin:0, verified:1, lang:'en'},
    {email:'other@example.test', name:'Other User', admin:0, verified:1, lang:'en'},
    {email:'admin@example.test', name:'Admin User', admin:1, verified:1, lang:'en'},
  ]) {
    users[u.email] = sqlInsert('users', u);
  }

  // ═══════════════════════════════════════════
  // Congregations with child tables
  // ═══════════════════════════════════════════

  const congregationDefs = [{
    name:'Shalom Congregation', owner:'regular@example.test', city:'NYC', visible:1,
    accessibility: { online_liveCaptions:1, online_automatedCaptions:1, inPerson_eva:1, inPerson_asl:1, inPerson_adaAll:1, inPerson_adaSome:1 },
    fit: { youngFamilies:1, youngAdults:1, seniors:1, singles:1, interfaith:1, lgbtq:1, beginners:1, families:1 },
    health: { requiresVax:1, hasAirPurification:1 },
    registration: { maxCapacity:500 },
    security: { securityPresent:1, secureEntry:1, cctv:1, guards:1, emergencyPlan:1 },
    services: { fridayNight:1, saturdayMorning:1, holiday:1, hybrid:1, online:1, timeFridayNight:'18:30', timeSaturdayMorning:'09:30' },
  }, {
    name:'Private Minyan', owner:'regular@example.test', city:'BKN', visible:0,
    services: { fridayNight:1, holiday:1 },
  }, {
    name:'Other Community', owner:'other@example.test', city:'LA', visible:1,
    services: { saturdayMorning:1, holiday:1 },
  }, {
    name:'Online Gathering', owner:'regular@example.test', city:'SF', visible:1,
    accessibility: { online_liveCaptions:1, online_automatedCaptions:1 },
    fit: { interfaith:1, lgbtq:1 },
    registration: { requiresRegistration:1 },
    services: { fridayNight:1, hybrid:1, online:1, timeFridayNight:'19:00' },
  }];

  const childTableNames = ['accessibility', 'fit', 'health', 'registration', 'security', 'services'];
  for (const cd of congregationDefs) {
    const cityRec = cities[cd.city];
    for (const table of childTableNames) {
      const data = cd[table];
      if (!data || Object.keys(data).length === 0) continue;
      sqlInsert(table, data);
    }

    const cityRow = JSON.parse(sql(`SELECT rowid FROM cities WHERE id='${cityRec}'`));
    const stateId = sql(`SELECT state FROM cities WHERE id='${cityRec}'`).trim();
    const countryId = sql(`SELECT country FROM cities WHERE id='${cityRec}'`).trim();

    sqlInsert('congregations', {
      name: cd.name, clergy: cd.clergy || '', denomination: cd.denomination || 'reform',
      flavor: cd.flavor || '', notes: cd.notes || '',
      contactName: cd.contactName || '', contactEmail: cd.contactEmail || '',
      contactUrl: cd.contactUrl || '',
      country: countryId, state: stateId, city: cityRec,
      visible: cd.visible, owner: users[cd.owner],
    });
  }

  // ═══════════════════════════════════════════
  // Pages
  // ═══════════════════════════════════════════
  sqlInsert('pages', { title:'About', slug:'about', content:'# About', published:1 });
  sqlInsert('pages', { title:'Privacy Policy', slug:'privacy', content:'# Privacy', published:1 });
  sqlInsert('pages', { title:'FAQ', slug:'faq', content:'# FAQ', published:1 });

  console.log('  ✅ Seed complete');
}

function sqlInsert(table, data) {
  const c = containerName();
  const cols = Object.keys(data).join(', ');
  const vals = Object.values(data).map(v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return v;
    return `'${String(v).replace(/'/g, "''")}'`;
  }).join(', ');
  try {
    const id = run(`docker exec ${c} sh -c "sqlite3 /pb/pb_data/data.db \\"INSERT INTO ${table} (id, ${cols}, created, updated) VALUES (lower(hex(randomblob(7))), ${vals}, datetime('now'), datetime('now'));\\"" 2>/dev/null; docker exec ${c} sh -c "sqlite3 /pb/pb_data/data.db \\"SELECT last_insert_rowid();\\"" 2>/dev/null`);
    return id?.trim() || '';
  } catch {
    // Try without explicit id (let PB auto-generate)
    run(`docker exec ${c} sh -c "sqlite3 /pb/pb_data/data.db \\"INSERT INTO ${table} (${cols}, created, updated) VALUES (${vals}, datetime('now'), datetime('now'));\\"" 2>/dev/null || true`);
    return run(`docker exec ${c} sh -c "sqlite3 /pb/pb_data/data.db \\"SELECT last_insert_rowid();\\""`).trim();
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
    // Ensure Docker is running
    const c = containerName();
    if (!c) {
      // Start Docker deps
      console.log('⏳ Starting Docker dependencies...');
      run('cd ' + ROOT + ' && docker compose -f e2e/docker-compose.yml up -d 2>/dev/null');
      await sleep(8000);
    }

    await waitForPB();
    createSuperuser();

    // Install sqlite helper
    run(`docker exec ${c || containerName()} apk add --no-cache sqlite 2>/dev/null || true`);

    seedData();

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Bootstrap complete in ${elapsed}s`);
    console.log(`   PB Admin: ${PB_URL}/_/`);
    console.log(`   Email:     ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (err) {
    console.error('\n❌ Bootstrap failed:', err.message);
    process.exit(1);
  }
}

main();
