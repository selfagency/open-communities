#!/usr/bin/env node

/**
 * Verify PocketBase hooks loaded without errors.
 * Checks PB container logs for common hook-loading failure patterns.
 *
 * Usage:
 *   node docker/scripts/verify-hooks.mjs
 *   pnpm deps:verify-hooks
 */

const CONTAINER = process.env.PB_CONTAINER || 'docker-pocketbase-1';

try {
  const { execSync } = await import('node:child_process');
  const logs = execSync(`docker logs ${CONTAINER} 2>&1`, {
    encoding: 'utf8',
    timeout: 10000,
  });

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

  if (errors.length > 0) {
    console.error('❌ PB hook errors detected:');
    for (const err of errors.slice(0, 20)) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }

  console.log('✅ PB hooks loaded cleanly');
} catch (err) {
  if (err.message?.includes('docker logs')) {
    console.error(`❌ Cannot read PB container logs — is ${CONTAINER} running?`);
    process.exit(1);
  }
  console.error(`❌ Hook verification failed: ${err.message}`);
  process.exit(1);
}
