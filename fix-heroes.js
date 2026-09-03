const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Regex to match the standard hero section, optionally with the existing min-h- and flex classes
            const pattern = /className="relative w-full (?:min-h-\[[^\]]+\] flex flex-col justify-center )?overflow-hidden bg-\[var\(--color-midnight\)\] pt-20/g;
            const newClass = 'className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pt-20';
            const replaced = content.replace(pattern, newClass);
            if (replaced !== content) {
                fs.writeFileSync(fullPath, replaced, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    }
}
processDir('app');
