const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const dateLogic = `const effectiveDate = r.governanceOrigin === 'native_governed' || r.govType === 'native_governed'
                        ? (r.publishedAt || r.releaseDate || r.createdAt)
                        : (r.releaseDate || r.publishedAt || r.createdAt);`;

// Insert dateLogic before `const durationSecs = ...` inside the map function
content = content.replace(/const durationSecs = r.durationSeconds/g, dateLogic + '\n                    const durationSecs = r.durationSeconds');

// Replace `publishedAt: r.publishedAt || r.releaseDate || r.createdAt` with `publishedAt: effectiveDate`
content = content.replace(/publishedAt:\s*r\.publishedAt\s*\|\|\s*r\.releaseDate\s*\|\|\s*r\.createdAt/g, 'publishedAt: effectiveDate');
content = content.replace(/publishedDate:\s*r\.publishedAt\s*\|\|\s*r\.releaseDate\s*\|\|\s*r\.createdAt/g, 'publishedDate: effectiveDate');

fs.writeFileSync(file, content);
