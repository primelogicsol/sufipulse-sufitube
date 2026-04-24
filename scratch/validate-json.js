
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(process.cwd(), '.data', 'cms-releases.json');
  const content = fs.readFileSync(filePath, 'utf8');
  const releases = JSON.parse(content);
  console.log(`Successfully parsed ${releases.length} releases.`);
  
  releases.forEach((r, i) => {
    if (!r.id) console.log(`Release ${i} missing ID`);
    if (!r.slug) console.log(`Release ${i} missing slug`);
    if (!r.youtubeId) console.log(`Release ${i} missing youtubeId`);
  });
  
  const target = releases.find(r => r.youtubeId === 'aMzdiIuYgK4');
  if (target) {
    console.log('Target release found:', target.id);
  } else {
    console.log('Target release NOT found!');
  }
} catch (e) {
  console.error('Validation failed:', e.message);
}
