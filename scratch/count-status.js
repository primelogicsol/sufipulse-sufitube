
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), '.data', 'cms-releases.json');
const content = fs.readFileSync(filePath, 'utf8');
const releases = JSON.parse(content);

const counts = releases.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});

console.log('Release counts by status:', counts);
console.log('Total releases:', releases.length);
