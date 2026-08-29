const fs = require('fs');
const path = require('path');
const file = path.join('.data', 'cms-releases.json');

if (fs.existsSync(file)) {
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = 0;
  for (const release of data) {
    if (release.youtubeId && release.youtubeTitle) {
      const yt = (release.youtubeTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cms = (release.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // If CMS is a substring of YT (meaning it was probably automatically stripped), OR if they are identical
      if (yt.includes(cms) || cms.includes(yt)) {
        release.title = release.youtubeTitle;
        release.canonicalTitle = release.youtubeTitle;
        release.titleSource = 'youtube';
        changed++;
      } else {
        // Genuine admin override
        release.titleSource = 'admin';
        changed++;
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Reconciled ${changed} releases.`);
} else {
  console.log("File not found");
}
