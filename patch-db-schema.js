const fs = require('fs');
const file = 'lib/database-schema.ts';
let content = fs.readFileSync(file, 'utf8');

const fields = `  youtube_content_type?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'STORY' | 'UNSPECIFIED';
  format_classification_source?: 'youtube_analytics' | 'channel_surface' | 'dashboard' | 'duration_heuristic';
  status:`;

content = content.replace(/  status:/, fields);

fs.writeFileSync(file, content);
