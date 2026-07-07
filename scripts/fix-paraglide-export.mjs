#!/usr/bin/env node

/**
 * Overwrites the generated messages.js to replace `export * as m` with
 * `import * + export const m`, which Rolldown can resolve correctly.
 *
 * This runs AFTER paraglide-js compile but BEFORE vite build, so the
 * corrected file is on disk when Vite's module graph processes it.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const msgsPath = resolve(__dirname, '..', 'src/lib/paraglide/messages.js');

const content = [
  '/* eslint-disable */',
  "import * as _m from './messages/_index.js';",
  'export const m = _m;',
  "export * from './messages/_index.js';",
  ''
].join('\n');

try {
  writeFileSync(msgsPath, content);
  console.log(`✅ Fixed ${msgsPath}`);
} catch (err) {
  console.error(`❌ Failed to write ${msgsPath}: ${err.message}`);
  process.exit(1);
}
