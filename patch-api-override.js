const fs = require('fs');
const file = 'app/api/releases/import-youtube/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Update ReconciliationStatus
content = content.replace(/type ReconciliationStatus = 'matched' \| 'youtube_only' \| 'metadata_mismatch' \| 'duplicate';/, `type ReconciliationStatus = 'matched' | 'youtube_only' | 'metadata_mismatch' | 'duplicate' | 'canonical_override';`);

// Update the reconciliation status logic
const logicRegex = /let reconciliationStatus: ReconciliationStatus = 'matched';[\s\S]*?else if \(mismatchFields\.length > 0\) reconciliationStatus = 'metadata_mismatch';/;
const newLogic = `let reconciliationStatus: ReconciliationStatus = 'matched';
  
        if (matches.length > 1) {
          reconciliationStatus = 'duplicate';
        } else if (!existing) {
          reconciliationStatus = 'youtube_only';
        } else if (mismatchFields.length > 0) {
          reconciliationStatus = 'metadata_mismatch';
        } else {
          // Check for canonical override
          const currentCanonical = existing.canonicalTitle || existing.title || '';
          const currentYoutube = existing.youtubeTitle || '';
          if (currentCanonical && currentYoutube && normalizeText(currentCanonical) !== normalizeText(currentYoutube)) {
            reconciliationStatus = 'canonical_override';
          }
        }`;
content = content.replace(logicRegex, newLogic);

// Update reconciliation counting
const reconciliationRegex = /metadataMismatch: rows\.filter\(row => row\.reconciliationStatus === 'metadata_mismatch'\)\.length,/;
const newReconciliation = `metadataMismatch: rows.filter(row => row.reconciliationStatus === 'metadata_mismatch').length,
        canonicalOverride: rows.filter(row => row.reconciliationStatus === 'canonical_override').length,`;
content = content.replace(reconciliationRegex, newReconciliation);

fs.writeFileSync(file, content);
