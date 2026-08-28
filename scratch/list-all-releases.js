const fs = require('fs');
const path = './.data/cms-releases.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log('Total releases in DB:', data.length);
data.forEach((r, i) => {
  console.log(`${i + 1}. [${r.id}] (yt: ${r.youtubeId}) -> "${r.title}"`);
});
