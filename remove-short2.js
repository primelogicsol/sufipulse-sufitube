const fs = require('fs');
const file = 'lib/youtube-data-api-readonly.ts';
let content = fs.readFileSync(file, 'utf8');

const badInfer = "if (durationSeconds > 0 && durationSeconds <= 180) return 'short';";
content = content.replace(badInfer, "// Removed duration-based short inference");

fs.writeFileSync(file, content);
