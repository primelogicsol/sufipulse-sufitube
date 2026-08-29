const fs = require('fs');
let file, content;

// Fix A: lib/cms-storage.ts (Interfaces)
file = 'lib/cms-storage.ts';
content = fs.readFileSync(file, 'utf8');
const cmsReleaseFields = `  youtubeTitleLastSyncedAt?: string;
  youtubeContentType?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'UNSPECIFIED';
  formatClassificationSource?: 'youtube_analytics' | 'youtube_shorts_surface' | 'dashboard' | 'legacy' | 'inferred';`;
content = content.replace(/  youtubeTitleLastSyncedAt\?: string;/, cmsReleaseFields);

// Fix C: lib/cms-storage.ts (Duration inference)
content = content.replace(/format: r\.format \|\| \(r\.durationSeconds <= 60 \? 'short' : 'video'\)/g, "format: r.format || 'video'");
fs.writeFileSync(file, content);


// Fix B: lib/database-schema.ts
file = 'lib/database-schema.ts';
content = fs.readFileSync(file, 'utf8');
const dbSchemaFields = `  youtube_title_last_synced_at?: string;
  youtube_content_type?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'UNSPECIFIED';
  format_classification_source?: 'youtube_analytics' | 'youtube_shorts_surface' | 'dashboard' | 'legacy' | 'inferred';`;
content = content.replace(/  youtube_title_last_synced_at\?: string;/, dbSchemaFields);
fs.writeFileSync(file, content);


// Fix C: server/storage/release-dto.ts
file = 'server/storage/release-dto.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/canonical\.format = canonical\.format \|\| \(\(canonical\.durationSeconds as any\) <= 60 \? 'short' : 'video'\);/g, "canonical.format = canonical.format || 'video';");
fs.writeFileSync(file, content);


// Fix C: server/db/release-mapper.ts
file = 'server/db/release-mapper.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/format: release\.format \|\| \(\(release\.durationSeconds as any\) <= 60 \? 'short' : 'video'\)/g, "format: release.format || 'video'");
fs.writeFileSync(file, content);

console.log("Types and logic patched.");
