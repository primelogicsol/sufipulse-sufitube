const fs = require('fs');
const file = 'GEMINI.md';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "The title-governance architecture is a frozen governance invariant requiring an explicit architecture revision to change.";

if (!content.includes(targetStr)) {
  content += "\n\n" + targetStr + "\n";
  fs.writeFileSync(file, content);
}
