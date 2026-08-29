const fs = require('fs');
const file = 'server/db/release-repository.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
    let orderBy = \`(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST\`;
    
    if (query.sort === 'newest' || !query.sort) {
      orderBy = \`(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST\`;
    } else if (query.sort === 'oldest') {
      orderBy = \`(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) ASC NULLS LAST, registry_order ASC NULLS LAST\`;
    } else if (query.sort === 'popular') {
      orderBy = \`COALESCE(view_count, 0) DESC, (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST\`;
    } else if (query.sort === 'default') {
      orderBy = \`(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST\`;
    }
`;

content = content.replace(/let orderBy = \'(CASE WHEN governance_origin[\s\S]*?\}\n/m, replacement.trim() + '\n');
fs.writeFileSync(file, content);
