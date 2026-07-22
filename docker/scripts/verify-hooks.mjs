#!/usr/bin/env node

/**
 * Verify PocketBase hooks loaded and execute without errors.
 *
 * 1. Checks PB container logs for load-time hook errors.
 * 2. Sends a real API request to trigger request hooks (onRecordsListRequest, etc.).
 * 3. Re-checks logs for runtime errors from hook execution.
 *
 * Usage:
 *   node docker/scripts/verify-hooks.mjs
 *   pnpm deps:verify-hooks
 */

const CONTAINER = process.env.PB_CONTAINER || 'docker-pocketbase-1';
const PB_URL = process.env.PUBLIC_API_ENDPOINT || 'http://127.0.0.1:8090';

function getLogs() {
  const { execSync } = await import('node:child_process');
  return execSync(`docker logs ${CONTAINER} 2>&1`, {
    encoding: 'utf8',
    timeout: 10000,
  });
}

function findHookErrors(logs) {
  const errorPatterns = [
    /error/i,
    /referenceerror/i,
    /typeerror/i,
    /is not defined/i,
    /cannot find/i,
    /the handler must/i,
  ];

  const errors = [];
  for (const line of logs.split('\n')) {
    for (const pattern of errorPatterns) {
      if (pattern.test(line)) {
        errors.push(line.trim());
        break;
      }
    }
  }
  return errors;
}

try {
  // Phase 1: check load-time errors
  const loadLogs = getLogs();
  const loadErrors = findHookErrors(loadLogs);
  if (loadErrors.length > 0) {
    console.error('❌ PB hook load errors detected:');
    for (const err of loadErrors.slice(0, 20)) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }
  console.log('✅ PB hooks loaded without errors');

  // Phase 2: send a real API request to trigger request hooks
  const healthRes = await fetch(`${PB_URL}/api/health`);
  if (!healthRes.ok) {
    console.error(`❌ PB health check failed: ${healthRes.status}`);
    process.exit(1);
  }

  // Send a list request to trigger onRecordsListRequest hook
  const listRes = await fetch(`${PB_URL}/api/collections/users/records?perPage=1`, {
    headers: { 'x-request-id': `hook-verify-${Date.now()}` },
  });
  if (!listRes.ok) {
    console.error(`❌ PB list request failed: ${listRes.status}`);
    process.exit(1);
  }
  console.log('✅ PB request hooks triggered (list users)');

  // Phase 3: re-check logs for runtime errors from hook execution
  const runtimeLogs = getLogs();
  const runtimeErrors = findHookErrors(runtimeLogs);
  const newErrors = runtimeErrors.filter(
    (e) => !loadErrors.includes(e)
  );
  if (newErrors.length > 0) {
    console.error('❌ PB hook runtime errors detected:');
    for (const err of newErrors.slice(0, 20)) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }
  console.log('✅ PB hooks executed without runtime errors');
} catch (err) {
  if (err.message?.includes('docker logs')) {
    console.error(`❌ Cannot read PB container logs — is ${CONTAINER} running?`);
    process.exit(1);
  }
  if (err.message?.includes('fetch failed')) {
    console.error(`❌ Cannot reach PB at ${PB_URL} — is it running?`);
    process.exit(1);
  }
  console.error(`❌ Hook verification failed: ${err.message}`);
  process.exit(1);
}
