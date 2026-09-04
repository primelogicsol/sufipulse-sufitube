const fs = require('fs');
const path = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const importStr = "import { FlagshipSpotlight } from '@/app/components/releases/FlagshipSpotlight';\r\n";
if (!content.includes('FlagshipSpotlight')) {
    content = content.replace(/(import .*;\r?\n)/, '$1' + importStr);
}

const startRegex = /\{\/\*\s*──\s*02\.\s*Featured Release Spotlight\s*──\s*\*\/\}\s*\{featuredRelease && \(/;
const startIndex = content.search(startRegex);

if (startIndex !== -1) {
    const sectionStart = content.substring(startIndex);
    const endMatch = sectionStart.match(/<\/section>\r?\n\s*\)\}/);
    if (endMatch) {
        const endIndex = endMatch.index + endMatch[0].length;
        const toReplace = sectionStart.substring(0, endIndex);
        const replacement = `{/* ── 02. Featured Release Spotlight ── */}\r\n            {featuredRelease && (\r\n                <FlagshipSpotlight release={featuredRelease} sourcePage="releases" />\r\n            )}`;
        content = content.replace(toReplace, replacement);
    }
}

fs.writeFileSync(path, content);
