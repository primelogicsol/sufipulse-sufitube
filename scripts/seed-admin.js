'use strict';

// scripts/seed-admin.js
//
// Seeds or updates the admin user in .data/users.json.
//
// Mirrors exactly:
//   - lib/database.ts  → DATA_DIR, generateId(), plain-array file format
//   - server/services/auth.ts → bcryptjs, BCRYPT_ROUNDS
//   - server/db/repositories/users.ts → findByEmail (exact match, case-sensitive)
//
// Usage:
//   npm run seed:admin
//   docker exec sufipulse-new-app npm run seed:admin
//
// IMPORTANT: After running this script, restart the container so the
// in-memory database reloads from disk:
//   docker compose -p sufipulse_new restart app

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Mirrors server/config.ts: optInt('BCRYPT_ROUNDS', 12) ─────────────────────
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// ── Mirrors lib/database.ts: DATA_DIR ─────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// ── Mirrors lib/database.ts: generateId() ─────────────────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Admin record ───────────────────────────────────────────────────────────────
// sanitizeEmail in the frontend lowercases before submitting, so store lowercase.
const ADMIN_EMAIL    = 'fk.envcal@gmail.com';
const ADMIN_PASSWORD = 'Susan7861%';
const ADMIN_NAME     = 'Fayaz';

async function main() {
  console.log('[seed-admin] starting');
  console.log('[seed-admin] DATA_DIR   :', DATA_DIR);
  console.log('[seed-admin] USERS_FILE :', USERS_FILE);
  console.log('[seed-admin] CWD        :', process.cwd());

  // ── Ensure .data/ exists and is writable ────────────────────────────────────
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[seed-admin] created .data directory');
  }

  try {
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
  } catch {
    console.error('[seed-admin] FATAL: .data directory is not writable by this process.');
    console.error('             Run: docker exec -u root sufipulse-new-app chown -R nextjs /app/.data');
    process.exit(1);
  }

  // ── Load existing users (plain array — mirrors DatabaseTable.load()) ─────────
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    let raw;
    try {
      raw = fs.readFileSync(USERS_FILE, 'utf-8');
    } catch (err) {
      console.error('[seed-admin] FATAL: cannot read', USERS_FILE, ':', err.message);
      process.exit(1);
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users = parsed;
        console.log('[seed-admin] loaded', users.length, 'existing user(s)');
      } else {
        // Handles legacy { records: [...] } format written by earlier broken seeds
        console.warn('[seed-admin] users.json was not a plain array — resetting to empty.');
        users = [];
      }
    } catch (err) {
      console.error('[seed-admin] FATAL: users.json is not valid JSON:', err.message);
      process.exit(1);
    }
  } else {
    console.log('[seed-admin] users.json does not exist — will create it');
  }

  // ── Hash password using the same library + rounds as auth.ts ────────────────
  console.log('[seed-admin] hashing password with bcryptjs, rounds:', BCRYPT_ROUNDS);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  // ── Self-verify immediately — catches wrong bcryptjs build in container ──────
  const verified = await bcrypt.compare(ADMIN_PASSWORD, passwordHash);
  if (!verified) {
    console.error('[seed-admin] FATAL: bcrypt self-verification failed. Hash is unusable.');
    process.exit(1);
  }
  console.log('[seed-admin] hash self-verified ✓');

  // ── Upsert ──────────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const existingIndex = users.findIndex(u => u.email === ADMIN_EMAIL);

  if (existingIndex >= 0) {
    // Preserve id and created_at; update everything else
    users[existingIndex] = {
      ...users[existingIndex],
      full_name:      ADMIN_NAME,
      role:           'admin',
      assigned_roles: ['admin'],
      password_hash:  passwordHash,
      is_verified:    true,
      is_blocked:     false,
      updated_at:     now,
    };
    console.log('[seed-admin] updated existing user:', ADMIN_EMAIL);
    console.log('[seed-admin] preserved id:', users[existingIndex].id);
  } else {
    const newId = generateId();
    users.push({
      id:             newId,
      email:          ADMIN_EMAIL,
      full_name:      ADMIN_NAME,
      role:           'admin',
      assigned_roles: ['admin'],
      password_hash:  passwordHash,
      is_verified:    true,
      is_blocked:     false,
      created_at:     now,
      updated_at:     now,
    });
    console.log('[seed-admin] created new admin user:', ADMIN_EMAIL, 'id:', newId);
  }

  // ── Write atomically — mirrors DatabaseTable.save() ─────────────────────────
  const tmpFile = USERS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.renameSync(tmpFile, USERS_FILE);

  console.log('[seed-admin] wrote', users.length, 'user(s) to', USERS_FILE);

  // ── Post-write read-back to confirm file is intact ───────────────────────────
  const written = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  const adminInFile = written.find(u => u.email === ADMIN_EMAIL);
  if (!adminInFile || adminInFile.role !== 'admin') {
    console.error('[seed-admin] FATAL: read-back verification failed.');
    process.exit(1);
  }
  console.log('[seed-admin] read-back verified ✓  role:', adminInFile.role, 'is_verified:', adminInFile.is_verified);

  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  seed:admin complete');
  console.log('  email :', ADMIN_EMAIL);
  console.log('  role  : admin');
  console.log('══════════════════════════════════════════════');
  console.log('');
  console.log('  NEXT STEP — restart the container so the');
  console.log('  in-memory database reloads from disk:');
  console.log('');
  console.log('  docker compose -p sufipulse_new restart app');
  console.log('');
}

main().catch(err => {
  console.error('[seed-admin] Fatal:', err.message || err);
  process.exit(1);
});
