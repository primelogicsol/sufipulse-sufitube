const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const regex2 = /export const mapVideoToRelease = \(video: any, existing\?: CMSRelease \| null\): CMSRelease => \{\s*\/\/ Standardize ID: Use existing or create with prefix to match local convention\s*const id = existing\?\.id \|\| `release_\$\{Date\.now\(\)\}_\$\{video\.id\}`;\s*const slug = existing\?\.slug \|\| buildUniqueSlug\(video\.title \|\| video\.snippet\?\.title \|\| 'Untitled', video\.id, existing\?\.id\);\s*const now = new Date\(\)\.toISOString\(\);\s*const title = video\.title \|\| video\.snippet\?\.title \|\| '';/g;

const replacement2 = `export const mapVideoToRelease = (video: any, existing?: CMSRelease | null): CMSRelease => {
    const rawTitle = video.title || video.snippet?.title || '';
    const governedCanonicalTitle = existing?.canonicalTitle || existing?.title || initializeCanonicalTitle(rawTitle);
    
    const id = existing?.id || \`release_\${Date.now()}_\${video.id}\`;
    const slug = existing?.slug || buildUniqueSlug(governedCanonicalTitle, video.id, existing?.id);
    const now = new Date().toISOString();
    const title = rawTitle;`;

content = content.replace(regex2, replacement2);
fs.writeFileSync(file, content);
