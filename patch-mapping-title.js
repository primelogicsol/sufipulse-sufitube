const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const newCode = 
export function initializeCanonicalTitle(youtubeTitle: string): string {
  if (!youtubeTitle) return 'Untitled Release';
  
  // 1. Normalize whitespace
  let title = youtubeTitle.replace(/\\s+/g, ' ').trim();
  
  // 2. Remove exact terminal channel branding
  if (title.endsWith(' | SufiPulse USA')) {
    title = title.replace(' | SufiPulse USA', '');
  }
  
  // 3. Take leading identity segment before first spaced pipe separator
  const parts = title.split(' | ');
  return parts[0].trim() || 'Untitled Release';
}
;

if (!content.includes('initializeCanonicalTitle')) {
  content = content.replace("export const slugify", newCode + "\nexport const slugify");
  fs.writeFileSync(file, content);
}
