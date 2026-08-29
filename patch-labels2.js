const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<label\s+key=\{pl\.id\}/g, '<div key={pl.id}');

// Now replace all closing </label> that are part of the list mapping
content = content.replace(/<\/label>/g, '</div>');

fs.writeFileSync(file, content);
