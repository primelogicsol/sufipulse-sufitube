const fs = require('fs');
const file = 'app/api/releases/import-youtube/route.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /const saved = cmsServerStorage\.bulkSaveReleases\(toSave\);\s*cmsServerStorage\.forceHydrate\(\);/g;
const replacement = `const saved = cmsServerStorage.bulkSaveReleasesTransactional(toSave);
    cmsServerStorage.forceHydrate();
    
    // Read-back verification
    const allReleasesAfter = cmsServerStorage.getAllReleases();
    const verifiedCount = saved.filter(s => allReleasesAfter.some(r => r.id === s.id)).length;
`;

content = content.replace(regex, replacement);

const regex2 = /count: saved\.length,/g;
const replacement2 = `count: saved.length,
      verifiedCount,`;
content = content.replace(regex2, replacement2);

fs.writeFileSync(file, content);
