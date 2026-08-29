const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{youtubeMessage\}<\/p>/g, '{typeof youtubeMessage === "string" ? <p className="text-sm mb-3" style={{ color: "var(--dash-text-secondary)" }}>{youtubeMessage}</p> : <div className="mb-4">{youtubeMessage}</div>}');

content = content.replace(/<p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{liveMessage\}<\/p>/g, '{typeof liveMessage === "string" ? <p className="text-sm mb-3" style={{ color: "var(--dash-text-secondary)" }}>{liveMessage}</p> : <div className="mb-4">{liveMessage}</div>}');

content = content.replace(/<p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{playlistMessage\}<\/p>/g, '{typeof playlistMessage === "string" ? <p className="text-sm mb-3" style={{ color: "var(--dash-text-secondary)" }}>{playlistMessage}</p> : <div className="mb-4">{playlistMessage}</div>}');

fs.writeFileSync(file, content);
