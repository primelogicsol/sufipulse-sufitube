const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const dateLogic = `const effectiveDate = r.governanceOrigin === 'native_governed' || r.govType === 'native_governed'
                        ? (r.publishedAt || r.releaseDate || r.createdAt)
                        : (r.releaseDate || r.publishedAt || r.createdAt);`;

content = content.replace(/const canonicalTitle =/g, dateLogic + '\n                const canonicalTitle =');

fs.writeFileSync(file, content);
