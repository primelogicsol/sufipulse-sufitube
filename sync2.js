const fs = require('fs');
let script = fs.readFileSync('scripts/phase2-import-releases.mjs', 'utf8');
script = script.replace(/const EXPECTED_SHA = '[0-9a-f]+';/, `const EXPECTED_SHA = '1a60146e972370bc610c0f0d272e4045ece5347a35dbde528f53cb2fb4a86b0e';`);
fs.writeFileSync('scripts/phase2-import-releases.mjs', script);
