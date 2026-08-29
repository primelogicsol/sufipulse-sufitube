const fs = require('fs');
const file = 'lib/cms-storage.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('titleSource?:')) {
  content = content.replace(/youtubeTitle\?: string; \/\/ Current YouTube packaging title/, `youtubeTitle?: string; // Current YouTube packaging title
    titleSource?: 'youtube' | 'admin';`);
  fs.writeFileSync(file, content);
}
