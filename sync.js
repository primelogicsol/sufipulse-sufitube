const fs = require('fs');
fs.copyFileSync('.data/cms-releases.json', '.phase2/reconciled-cms-releases.json');
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update(fs.readFileSync('.phase2/reconciled-cms-releases.json')).digest('hex');
console.log('New hash:', hash);

let script = fs.readFileSync('scripts/phase2-import-releases.mjs', 'utf8');
script = script.replace(/const EXPECTED_HASH = '[0-9a-f]+';/, `const EXPECTED_HASH = '${hash}';`);
script = script.replace(/if \(releases\.length !== \d+\)/, `if (releases.length !== 95)`);
script = script.replace(/Expected \d+ records/g, `Expected 95 records`);
fs.writeFileSync('scripts/phase2-import-releases.mjs', script);
