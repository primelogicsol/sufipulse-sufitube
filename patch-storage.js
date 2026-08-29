const fs = require('fs');
const file = 'lib/cms-storage.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/youtubeTitle\?: string; \/\/ Current YouTube packaging title/g, `youtubeTitle?: string; // Current YouTube packaging title
  youtubeDescription?: string;`);
fs.writeFileSync(file, content);
