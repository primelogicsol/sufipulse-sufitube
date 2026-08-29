const fs = require('fs');
const file = 'app/api/releases/import-youtube/live/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/toSave\.push\(mapVideoToRelease\(video, existing\)\);/g, `toSave.push(mapVideoToRelease(video, existing, resolutions[video.id]));`);

fs.writeFileSync(file, content);
