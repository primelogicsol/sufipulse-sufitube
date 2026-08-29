const fs = require('fs');
const files = ['app/api/releases/import-youtube/route.ts', 'app/api/releases/import-youtube/live/route.ts'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\| 'canonical_override'/g, `| 'admin_override'`);
  content = content.replace(/reconciliationStatus = 'canonical_override'/g, `reconciliationStatus = 'admin_override'`);
  content = content.replace(/canonicalOverride: rows\.filter\(row => row\.reconciliationStatus === 'canonical_override'\)\.length/g, `adminOverride: rows.filter(row => row.reconciliationStatus === 'admin_override').length`);
  
  // Re-write the logic block exactly
  const logicRegex = /else \{\s*\/\* Check for canonical override \*\/\s*const currentCanonical = existing\.canonicalTitle \|\| existing\.title \|\| '';\s*const currentYoutube = existing\.youtubeTitle \|\| '';\s*if \(currentCanonical && currentYoutube && normalizeText\(currentCanonical\) !== normalizeText\(currentYoutube\)\) \{\s*reconciliationStatus = 'admin_override';\s*\}\s*\}/g;
  
  const newLogic = `else if (existing.titleSource === 'admin') {
          reconciliationStatus = 'admin_override';
        }`;
        
  // actually wait, I need to find the previous else block exactly.
  // It's safer to use a loose replace or re-parse.
  content = content.replace(/else \{\s*\/\/ Check for canonical override[\s\S]*?\}\s*\}/g, newLogic);
  
  // Actually let's just do a string replacement of the specific block
  const oldStr = `} else {
          // Check for canonical override
          const currentCanonical = existing.canonicalTitle || existing.title || '';
          const currentYoutube = existing.youtubeTitle || '';
          if (currentCanonical && currentYoutube && normalizeText(currentCanonical) !== normalizeText(currentYoutube)) {
            reconciliationStatus = 'admin_override';
          }
        }`;
  const newStr = `} else if (existing.titleSource === 'admin') {
          reconciliationStatus = 'admin_override';
        }`;
  content = content.replace(oldStr, newStr);

  fs.writeFileSync(file, content);
}
