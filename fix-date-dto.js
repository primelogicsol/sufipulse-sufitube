const fs = require('fs');
const file = 'server/storage/release-dto.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /canonical\.publishedAt = canonical\.publishedAt \|\| canonical\.releaseDate \|\| canonical\.createdAt \|\| canonical\.created_at;/g;

const replacement = `const effectiveDate = canonical.govType === 'native_governed' || canonical.governanceOrigin === 'native_governed'
    ? (canonical.publishedAt || canonical.published_at || canonical.releaseDate || canonical.createdAt || canonical.created_at)
    : (canonical.releaseDate || canonical.publishedAt || canonical.published_at || canonical.createdAt || canonical.created_at);
  
  canonical.publishedAt = effectiveDate;
  canonical.publishedDate = effectiveDate;`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
