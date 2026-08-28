const fs = require('fs');
const file = 'server/storage/release-dto.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/  delete canonical\.youtubeTitle;\s+delete canonical\.canonicalTitle;\s+delete canonical\.metadataStatus;\s+delete canonical\.canonicalStatus;\s+delete canonical\.canonicalThumbnail;\s+delete canonical\.youtubeThumbnailUrl;/g, '  // Preserved A/B and canonical fields for architecture round-trip');

fs.writeFileSync(file, content);
