const fs = require('fs');
const file = 'server/db/release-repository.ts';
let content = fs.readFileSync(file, 'utf8');

const badLine = "orderBy = 'COALESCE(view_count, 0) DESC, (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;";
const goodLine = "orderBy = `COALESCE(view_count, 0) DESC, (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;";

content = content.replace(badLine, goodLine);
fs.writeFileSync(file, content);
