const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(df && df !== 'all'\) params\.set\('duration', df\);/g, "if (ff !== 'short' && df && df !== 'all') params.set('duration', df);");

fs.writeFileSync(file, content);
