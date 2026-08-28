const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\Fayaz\\Sufipulseupdate2026\\Sufipulseupdate';

function removeForceHydrate(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content.replace(/\s*registriesStorage\.forceHydrate\(\);/g, '');
    newContent = newContent.replace(/\s*cmsServerStorage\.forceHydrate\(\);/g, '');
    newContent = newContent.replace(/\s*graphResolver\.forceHydrate\(\);/g, '');
    newContent = newContent.replace(/\s*knowledgeStorage\.forceHydrate\(\);/g, '');
    
    // Add check to allow admin to bypass or just remove it altogether since it shouldn't be synchronous here?
    // "Remove or conditionalize them so anonymous public reads do NOT trigger synchronous disk rehydration."
    // Simple removal for these public reads is fine, as changes to these should trigger via revalidatePath anyway, 
    // or they rely on memory which is populated on startup/sync.

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}

const files = [
    'app/api/concepts/[slug]/route.ts',
    'app/api/moods/[slug]/route.ts',
    'app/api/regions/[slug]/route.ts',
    'app/api/themes/[slug]/route.ts',
    'app/api/registries/route.ts',
];

files.forEach(f => removeForceHydrate(path.join(projectRoot, f)));

