const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{new Date\(release\.govType === 'native_governed' \? \(release\.publishedDate \|\| \(release as any\)\.releaseDate \|\| \(release as any\)\.createdAt \|\| new Date\(\)\.toISOString\(\)\) : \(\(release as any\)\.releaseDate \|\| release\.publishedDate \|\| \(release as any\)\.createdAt \|\| new Date\(\)\.toISOString\(\)\)\)\.toLocaleDateString\('en-US', \{ month: 'short', year: 'numeric' \}\)\}/g;

const replacement = `{new Date(release.publishedDate || new Date().toISOString()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
