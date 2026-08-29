const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/release\.publishedDate \|\| release\.createdAt/g, 'release.publishedDate || new Date().toISOString()');

fs.writeFileSync(file, content);
