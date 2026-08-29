const fs = require('fs');
const file = 'lib/cms-storage-server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\*\*\r?\n \* Robust Data Directory Resolution[\s\S]*?const SERVER_DATA_DIR = resolveDataDir\(\);/g;

const replacement = `import { DATA_DIR as SERVER_DATA_DIR } from './server-data-dir';`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
