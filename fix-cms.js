const fs = require('fs');
const file = 'lib/cms-storage-server.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("console.log(\\[CMS-SERVER] Data Directory: \\);", "");
fs.writeFileSync(file, content);
