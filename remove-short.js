const fs = require('fs');
const file = 'lib/youtube-service.ts';
let content = fs.readFileSync(file, 'utf8');

const badInfer = "if (durationSeconds > 0 && durationSeconds <= 180) return 'short';";
content = content.replace(badInfer, "// Removed duration-based short inference per governance rule");

// Also update the comment above it
content = content.replace(/2\. durationSeconds <= 60.*\(YouTube Shorts heuristic\)/g, '2. Removed duration-based short inference (must be governed or explicitly parsed)');

fs.writeFileSync(file, content);
