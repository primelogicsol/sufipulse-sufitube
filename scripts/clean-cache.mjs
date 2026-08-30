/**
 * clean-cache.mjs
 *
 * Cross-platform Next.js build cache cleanup.
 * Replaces the bash `rm -rf` commands in package.json scripts that fail
 * silently on Windows PowerShell.
 *
 * Requires Node 20+ (native rmSync with recursive + force).
 * No external dependencies.
 *
 * force: true  -- tolerates "directory does not exist" (correct behaviour)
 * Other filesystem failures will still throw and halt startup (correct).
 */

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = [
  '.next',
  'node_modules/.cache',
];

for (const target of targets) {
  const full = resolve(process.cwd(), target);
  rmSync(full, { recursive: true, force: true });
  console.log(`[clean-cache] Removed ${target}`);
}

console.log('[clean-cache] Done.');
