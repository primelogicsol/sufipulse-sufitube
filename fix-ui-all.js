const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/<option value="all">All Statuses<\/option>/g, '<option value="all">All Releases</option>');
fs.writeFileSync(file, content);
