const fs = require('fs');
const file = 'lib/database-schema.ts';
let content = fs.readFileSync(file, 'utf8');

const oldFields = `  youtube_content_type?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'STORY' | 'UNSPECIFIED';
  format_classification_source?: 'youtube_analytics' | 'channel_surface' | 'dashboard' | 'duration_heuristic';`;

const newFields = `  youtube_content_type?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'UNSPECIFIED';
  format_classification_source?: 'youtube_analytics' | 'youtube_shorts_surface' | 'dashboard' | 'legacy' | 'inferred';`;

content = content.replace(oldFields, newFields);

fs.writeFileSync(file, content);
