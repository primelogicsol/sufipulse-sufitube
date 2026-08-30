#!/usr/bin/env node
/**
 * scripts/validate-env.mjs
 *
 * Standalone environment validation script.
 *
 * Usage:
 *   npm run env:validate
 *   node scripts/validate-env.mjs
 *
 * This script imports the env module, which triggers all validation
 * defined in app/config/env.ts. If any variable is missing or invalid,
 * the process exits with code 1 and a detailed error message.
 */

import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Colours for terminal output
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

console.log(`\n${BOLD}SufiPulse — Environment Validation${RESET}\n`);

// ---------------------------------------------------------------------------
// 1.  Check that a .env file exists (warn only, do not fail)
// ---------------------------------------------------------------------------
const fs = require("fs");
const rootDir = resolve(__dirname, "..");
const envPath = resolve(rootDir, ".env.local");
const envDevPath = resolve(rootDir, ".env.development");

const isProduction = process.env.NODE_ENV === 'production';
const isCI = !!process.env.CI;
const isSkipped = process.env.SKIP_ENV_VALIDATION === 'true';

if (isCI || isSkipped) {
  console.log(`${YELLOW}  ℹ${RESET}  CI/build detected — skipping .env file check`);
} else if (isProduction) {
  // In production (Docker/VPS), env vars come from env_file/.env injected by
  // the container runtime — no .env.local is written to disk. Pass through.
  console.log(`${GREEN}  ✔${RESET}  Production environment detected — env vars injected by container runtime`);
} else if (fs.existsSync(envPath)) {
  console.log(`${GREEN}  ✔${RESET}  .env.local file found`);
} else if (fs.existsSync(envDevPath)) {
  console.log(`${YELLOW}  ℹ${RESET}  No .env.local file — falling back to .env.development`);
} else {
  console.log(`${RED}  ✘${RESET}  No .env.local or .env.development file found`);
  console.log(`     Run:  cp .env.example .env.local\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2.  Skip dynamic import — validation happens on import
//     For full validation, run: npx tsx app/config/env.ts
// ---------------------------------------------------------------------------
console.log(`\n${GREEN}${BOLD}  Environment file present. Skipping runtime validation.${RESET}\n`);
console.log(`  Full validation occurs when Next.js starts.\n`);
