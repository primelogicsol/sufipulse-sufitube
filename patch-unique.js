const fs = require('fs');
const file = 'lib/cms-storage-server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /bulkSaveReleasesTransactional\(releases: CMSRelease\[\]\): CMSRelease\[\] \{/g;
const replacement = `bulkSaveReleasesTransactional(releases: CMSRelease[]): CMSRelease[] {
    ensureHydrated();
    
    // Server-side uniqueness check
    const existingReleases = cmsStorage.exportReleases();
    const seenYoutubeIds = new Set<string>();
    
    // Check incoming releases against themselves and existing db
    for (const r of releases) {
      if (!r.youtubeId) continue;
      if (seenYoutubeIds.has(r.youtubeId)) {
        throw new Error(\`Duplicate YouTube ID in payload: \${r.youtubeId}\`);
      }
      seenYoutubeIds.add(r.youtubeId);
      
      const conflicting = existingReleases.find(ex => ex.youtubeId === r.youtubeId && ex.id !== r.id);
      if (conflicting) {
        throw new Error(\`Duplicate YouTube ID: \${r.youtubeId} already mapped to CMS release \${conflicting.id}\`);
      }
    }
    
    // 1. Snapshot memory state`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
