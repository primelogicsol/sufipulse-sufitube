const fs = require('fs');
const file = 'lib/cms-storage.ts';
let content = fs.readFileSync(file, 'utf8');

const fields = `  youtubeContentType?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'STORY' | 'UNSPECIFIED';
  formatClassificationSource?: 'youtube_analytics' | 'channel_surface' | 'dashboard' | 'duration_heuristic';
  status:`;

content = content.replace(/  status:/, fields);

fs.writeFileSync(file, content);
