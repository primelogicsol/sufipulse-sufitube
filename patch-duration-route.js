const fs = require('fs');
const file = 'app/api/releases/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/if \(duration === 'short'\)\s*return secs > 0 && secs < 180;/, "if (duration === 'short')    return secs > 0 && secs < 180 && (r as any).format !== 'short';");
content = content.replace(/if \(duration === 'standard'\)\s*return secs >= 180 && secs <= 480;/, "if (duration === 'standard') return secs >= 180 && secs <= 480 && (r as any).format !== 'short';");
content = content.replace(/if \(duration === 'long'\)\s*return secs > 480;/, "if (duration === 'long')     return secs > 480 && (r as any).format !== 'short';");

fs.writeFileSync(file, content);
