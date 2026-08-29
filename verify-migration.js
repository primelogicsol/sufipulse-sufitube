const fs = require('fs');
const path = require('path');
const file = path.join('.data', 'cms-releases.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

let violations = 0;
for (const release of data) {
  if (release.youtubeId && release.titleSource === 'youtube') {
    if (release.title !== release.youtubeTitle) {
      console.log(`Violation: ${release.id} -> title: ${release.title}, youtubeTitle: ${release.youtubeTitle}`);
      violations++;
    }
  }
}
console.log(`Found ${violations} violations.`);
