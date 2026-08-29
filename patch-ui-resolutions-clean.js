const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update unresolvedConflicts to be 0 since resolutions is removed
content = content.replace(/const unresolvedConflicts = youtubeVideos\.filter\(v => [\s\S]*?\)\.length;/g, `const unresolvedConflicts = 0; // Resolutions removed, metadata updates are automatic based on titleSource`);

// Remove resolutions
content = content.replace(/const \[resolutions, setResolutions\] = useState<Record<string, 'youtube' \| 'cms'>>\(\{\}\);\s*/g, '');
content = content.replace(/setResolutions\(\{\}\);\s*/g, '');
content = content.replace(/!resolutions\[v\.id\]/g, 'false');
content = content.replace(/unresolvedConflicts > 0/g, 'false');

fs.writeFileSync(file, content);
