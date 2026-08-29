const fs = require('fs');
const file = 'server/db/release-repository.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the bad string construction
content = content.replace(/'\(CASE WHEN governance_origin = 'native_governed' THEN/g, "`\(CASE WHEN governance_origin = 'native_governed' THEN");
content = content.replace(/END\) DESC NULLS LAST, registry_order ASC NULLS LAST'/g, "END) DESC NULLS LAST, registry_order ASC NULLS LAST`");
content = content.replace(/END\) ASC NULLS LAST, registry_order ASC NULLS LAST'/g, "END) ASC NULLS LAST, registry_order ASC NULLS LAST`");
content = content.replace(/COALESCE\(view_count, 0\) DESC, `\(CASE WHEN/g, "`COALESCE(view_count, 0) DESC, (CASE WHEN");

fs.writeFileSync(file, content);
