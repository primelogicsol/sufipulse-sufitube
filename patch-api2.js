const fs = require('fs');
function updateEndpoint(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const saved = cmsServerStorage\.bulkSaveReleases\(toSave\);\s*cmsServerStorage\.forceHydrate\(\);/g, `const saved = cmsServerStorage.bulkSaveReleasesTransactional(toSave);
    cmsServerStorage.forceHydrate();
    
    // Read-back verification
    const allReleasesAfter = cmsServerStorage.getAllReleases();
    const verifiedCount = saved.filter(s => allReleasesAfter.some(r => r.id === s.id)).length;`);
    
  content = content.replace(/count: saved\.length,/g, `count: saved.length,
      verifiedCount,`);
      
  fs.writeFileSync(file, content);
}
updateEndpoint('app/api/releases/import-youtube/live/route.ts');
updateEndpoint('app/api/releases/import-youtube/playlists/route.ts');
