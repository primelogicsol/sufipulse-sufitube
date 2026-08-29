const fs = require('fs');
const file = 'GEMINI.md';
let content = fs.readFileSync(file, 'utf8');

const newRule = `

### Canonical Title Authority (A/B Testing Governance)
A/B testing on external platforms (like YouTube) may optimize packaging, but it **may never experiment with the canonical identity of the song**. 
- The **global canonical title** must remain immutable across YouTube, SufiPulse.com, Google, Bing, schema.org, and social graphs.
- Use **Variant A** as the global canonical publishing title.
- Design Variants B and C around the **exact same core title**, merely appending discovery/emotional qualifiers (e.g., \`[Core Title] | [Qualifier]\`).
- The canonical identity is stored natively as \`title\`, while the current active A/B test variant is stored safely aside as \`youtubeTitle\`, preserving search authority without fragmentation.
`;

content += newRule;
fs.writeFileSync(file, content);
