const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace onClick={fetchYouTubeVideos} with onClick={() => fetchYouTubeVideos()}
// I already did this in the new toolbar, but what about other places?
content = content.replace(/onClick=\{fetchYouTubeVideos\}/g, 'onClick={() => fetchYouTubeVideos()}');

fs.writeFileSync(file, content);
