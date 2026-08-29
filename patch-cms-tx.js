const fs = require('fs');
const file = 'lib/cms-storage-server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /bulkSaveReleases\(releases: CMSRelease\[\]\): CMSRelease\[\] \{/g;
const replacement = `bulkSaveReleasesTransactional(releases: CMSRelease[]): CMSRelease[] {
    ensureHydrated();
    
    // 1. Snapshot memory state
    const originalReleases = JSON.parse(JSON.stringify(cmsStorage.exportReleases()));
    const originalJoins = graphResolver.exportJoins();
    
    try {
      const saved: CMSRelease[] = [];
      for (const r of releases) {
        const s = cmsStorage.saveRelease(r);
        graphResolver.syncReleaseJoins(s, true); // skip individual persist
        saved.push(s);
      }
      
      // 2. Persist safely
      persist();
      graphResolver.forcePersist();
      
      return saved;
    } catch (e: any) {
      console.error('[CMS-SERVER] Transactional bulk save failed, rolling back...', e);
      
      // 3. Rollback in-memory state
      cmsStorage.clearAll();
      cmsStorage.importReleases(originalReleases);
      graphResolver.restoreJoins(originalJoins);
      
      // 4. Force disk to match restored memory
      try {
        persist();
      } catch (rollbackError) {
        console.error('[CMS-SERVER] FATAL: Rollback persist also failed!', rollbackError);
      }
      
      throw e;
    }
  },

  bulkSaveReleases(releases: CMSRelease[]): CMSRelease[] {`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
