const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const compose = read('docker-compose.yml');
const deploy = read('.github/workflows/deploy.yml');
const storage = read('server/storage/private-production-source-storage.ts');
const gitignore = read('.gitignore');

// The private production-source record must live under DATA_DIR, never in a
// public/static directory and never as an audio blob.
assert(
  storage.includes("path.join(DATA_DIR, 'private-production-sources.json')"),
  'Private production source storage must remain inside DATA_DIR.'
);
assert(!storage.includes('.mp3') && !storage.includes('.wav'), 'Private source storage must not persist MP3/WAV files.');
assert(storage.includes('mode: 0o600'), 'Private production metadata file must be created with restrictive permissions.');

// Docker Compose must persist the entire /app/.data tree across container
// replacement. This is what keeps private-production-sources.json alive.
assert(
  /-\s*app-data:\/app\/\.data\b/.test(compose),
  'docker-compose.yml must mount app-data at /app/.data.'
);
assert(
  /name:\s*sufipulse_new_data\b/.test(compose),
  'docker-compose.yml must use the stable sufipulse_new_data named volume.'
);

// Production deploy rewrites compose on the VPS. Guard that embedded copy too,
// otherwise the repository compose could be correct while production is not.
assert(
  deploy.includes('- app-data:/app/.data'),
  'Production deploy workflow must mount app-data at /app/.data.'
);
assert(
  deploy.includes('name: sufipulse_new_data'),
  'Production deploy workflow must retain the stable sufipulse_new_data volume.'
);
assert(
  deploy.includes('chown -R node:node /app/.data'),
  'Production deploy must preserve write ownership for the mounted data volume.'
);

// Runtime private metadata must remain excluded from Git commits.
assert(/(^|\n)\.data\/\s*(\n|$)/.test(gitignore), '.data/ must remain ignored by git.');
assert(
  !gitignore.includes('! .data/private-production-sources.json') &&
    !gitignore.includes('!.data/private-production-sources.json'),
  'Private production source metadata must never be unignored.'
);

console.log('Private production metadata persistence smoke test: PASS');
