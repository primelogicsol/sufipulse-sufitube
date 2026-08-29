const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{youtubeMessage && \(\s*\{typeof youtubeMessage === "string"\s*\?/g, '{youtubeMessage && (typeof youtubeMessage === "string" ?');
content = content.replace(/\{youtubeMessage\}\}<\/div>\}\s*\)\}/g, '{youtubeMessage}</div>)}');

content = content.replace(/\{liveMessage && \(\s*\{typeof liveMessage === "string"\s*\?/g, '{liveMessage && (typeof liveMessage === "string" ?');
content = content.replace(/\{liveMessage\}\}<\/div>\}\s*\)\}/g, '{liveMessage}</div>)}');

content = content.replace(/\{playlistMessage && \(\s*\{typeof playlistMessage === "string"\s*\?/g, '{playlistMessage && (typeof playlistMessage === "string" ?');
content = content.replace(/\{playlistMessage\}\}<\/div>\}\s*\)\}/g, '{playlistMessage}</div>)}');

// Also handle the deleted Audio notice div that caused JSX closing tag error
content = content.replace(/<\/DashboardLayout>\s*$/g, '</DashboardLayout>\n  );\n}');

fs.writeFileSync(file, content);
