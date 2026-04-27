// scripts/seed-admin.js
// Seeds / updates the admin user in .data/users.json.
// Uses the same bcryptjs hash that POST /api/auth/login verifies.
//
// Usage:
//   npm run seed:admin
//   docker exec sufipulse-new-app npm run seed:admin
//
// WARNING: contains a hardcoded password for operational seeding only.
// Remove or rotate credentials after first successful login.

'use strict';

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Config (mirrors server/services/auth.ts + server/config.ts) ──────────────
const ADMIN_EMAIL = 'fk.envcal@gmail.com';
const ADMIN_PASSWORD = 'Susan7861%';
const ADMIN_NAME = 'Fayaz';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

// ── Storage path (mirrors lib/database.ts DATA_DIR) ──────────────────────────
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// ── ID format (mirrors lib/database.ts generateId()) ─────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Ensure .data/ exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing users (plain array, same as DatabaseTable.load())
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users = parsed;
      } else {
        console.warn('[seed-admin] users.json was not an array — starting fresh.');
      }
    } catch (err) {
      console.error('[seed-admin] Failed to parse users.json:', err.message);
      process.exit(1);
    }
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const existingIndex = users.findIndex(u => u.email === ADMIN_EMAIL);

  if (existingIndex >= 0) {
    // Update existing record — preserve id and created_at
    users[existingIndex] = {
      ...users[existingIndex],
      full_name: ADMIN_NAME,
      role: 'admin',
      assigned_roles: ['admin'],
      password_hash: passwordHash,
      is_verified: true,
      is_blocked: false,
      updated_at: now,
    };
    console.log('[seed-admin] Updated existing user:', ADMIN_EMAIL);
  } else {
    // Insert new record
    users.push({
      id: generateId(),
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      role: 'admin',
      assigned_roles: ['admin'],
      password_hash: passwordHash,
      is_verified: true,
      is_blocked: false,
      created_at: now,
      updated_at: now,
    });
    console.log('[seed-admin] Created new admin user:', ADMIN_EMAIL);
  }

  // Write atomically (mirrors DatabaseTable.save())
  const tmpFile = USERS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), 'utf-8');
  fs.renameSync(tmpFile, USERS_FILE);

  console.log('[seed-admin] Done. users.json has', users.length, 'record(s).');
  console.log('[seed-admin] Login at /login with:', ADMIN_EMAIL);
}

main().catch(err => {
  console.error('[seed-admin] Fatal:', err);
  process.exit(1);
});
