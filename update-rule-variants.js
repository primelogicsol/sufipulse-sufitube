const fs = require('fs');
const file = 'GEMINI.md';
let content = fs.readFileSync(file, 'utf8');

// I'll just append it to the end or replace the existing one
const oldRuleRegex = /### Canonical Title Authority \(A\/B Testing Governance\)[\s\S]*?(?=\n#|$)/;

const newRule = `### Canonical Title Authority (A/B Testing Governance)
A/B testing on external platforms (like YouTube) may optimize packaging, but it **may never experiment with the canonical identity of the song**. 

**The Rule:**
- Canonical song title = permanent identity.
- YouTube Variant A = global default publishing title and closest public-facing form of the canonical title.
- Variant B = same core title + emotional/search qualifier.
- Variant C = same core title + genre/theme/discovery qualifier.
- All three variants must begin with the exact same canonical song title.

**Data Model Architecture:**
\`\`\`text
canonicalTitle
youtubeTitle
youtubeTitleVariantA
youtubeTitleVariantB
youtubeTitleVariantC
youtubeWinningVariant
youtubeTitleLastSyncedAt
\`\`\`

**Publishing Rule:**
- SufiPulse.com release card, H1, SEO <title>, OpenGraph, JSON-LD, internal search, and slug identity MUST use \`canonicalTitle\` / Variant A identity.
- YouTube experiments with A/B/C variants.
- The Winning YouTube variant updates \`youtubeTitle\` but **DOES NOT** overwrite \`canonicalTitle\`.
`;

if (content.match(oldRuleRegex)) {
    content = content.replace(oldRuleRegex, newRule);
} else {
    content += '\n\n' + newRule;
}

fs.writeFileSync(file, content);
