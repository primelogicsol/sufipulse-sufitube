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
            let changed = false;

            // Match ANY variation of the outer section that ends with the padding and border classes
            const outerRegex = /className="relative w-full .*?overflow-hidden bg-\[var\(--color-midnight\)\] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-\[var\(--color-border\)\]"/;
            
            if (outerRegex.test(content)) {
                content = content.replace(outerRegex, 'className="relative w-full min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed"');
                
                // 2. Move that padding to the inner content wrapper
                content = content.replace('className="relative z-10"', 'className="relative z-10 pt-20 md:pt-32"');
                
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed structure in: ' + fullPath);
            }
        }
    }
}
processDir('app');
