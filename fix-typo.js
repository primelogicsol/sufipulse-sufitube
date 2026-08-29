const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{newVideos\.length === 0 && updateVideos\.length === 0 && overrideVideos\.length === 0 && && updateVideos\.length === 0 &&/g, `{newVideos.length === 0 && updateVideos.length === 0 && overrideVideos.length === 0 &&`);

fs.writeFileSync(file, content);
