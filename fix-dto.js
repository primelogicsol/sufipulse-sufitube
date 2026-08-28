const fs = require('fs');
let content = fs.readFileSync('server/storage/release-dto.ts', 'utf8');

const injection = if (canonical.published_at && !canonical.publishedAt) canonical.publishedAt = canonical.published_at;
  canonical.visibility = canonical.visibility || 'public';
  canonical.format = canonical.format || ((canonical.durationSeconds || 0) <= 60 ? 'short' : 'video');
  canonical.releaseType = canonical.releaseType || 'studio-release';
  canonical.publishedAt = canonical.publishedAt || canonical.releaseDate || canonical.createdAt || canonical.created_at;;

content = content.replace('if (canonical.published_at && !canonical.publishedAt) canonical.publishedAt = canonical.published_at;', injection);
fs.writeFileSync('server/storage/release-dto.ts', content);
