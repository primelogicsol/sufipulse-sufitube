const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update buttons
content = content.replace(/Importing\.\.\.' : \`Import Selected/g, "Importing...' : `Import & Save Selected");
content = content.replace(/Import Selected \(/g, "Import & Save Selected (");
content = content.replace(/Import Selected/g, "Import & Save Selected");

// Change architecture text
// We'll update the layout
content = content.replace(/<div className="mb-6 dashboard-card p-4 flex items-start gap-3">[\s\S]*?<\/div>/, '');

fs.writeFileSync(file, content);
