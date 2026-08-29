const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change <label> to <div> for the list items to avoid hydration mismatch with nested buttons
content = content.replace(/<label\s+key=\{video\.id\}/g, '<div key={video.id}');
content = content.replace(/<\/label>\s*\)\)\}/g, '</div>\n                  ))}');

// Do the same for live streams just in case
content = content.replace(/<label\s+key=\{stream\.id\}/g, '<div key={stream.id}');
// Playlists
content = content.replace(/<label\s+key=\{playlist\.id\}/g, '<div key={playlist.id}');

fs.writeFileSync(file, content);
