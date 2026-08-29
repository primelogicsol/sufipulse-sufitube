const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /export function initializeCanonicalTitle\(youtubeTitle: string\): string \{\s*if \(\!youtubeTitle\) return 'Untitled Release';\s*\/\/ 1\. Normalize whitespace\s*let title = youtubeTitle\.replace\(\/\\s\+\/g, ' '\)\.trim\(\);\s*\/\/ 2\. Remove exact terminal channel branding\s*if \(title\.endsWith\(' \| SufiPulse USA'\)\) \{\s*title = title\.replace\(' \| SufiPulse USA', ''\);\s*\}\s*\/\/ 3\. Take leading identity segment before first spaced pipe separator\s*const parts = title\.split\(' \| '\);\s*return parts\[0\]\.trim\(\) \|\| 'Untitled Release';\s*\}/g;

const replacement1 = `export function initializeCanonicalTitle(youtubeTitle: string): string {
  if (!youtubeTitle || !youtubeTitle.trim()) {
    throw new Error('Release validation failed: Missing canonical title');
  }
  
  // 1. Normalize whitespace
  let title = youtubeTitle.replace(/\\s+/g, ' ').trim();
  
  // 2. Remove exact terminal channel branding
  if (title.endsWith(' | SufiPulse USA')) {
    title = title.replace(' | SufiPulse USA', '');
  }
  
  // 3. Take leading identity segment before first spaced pipe separator
  const parts = title.split(' | ');
  const finalTitle = parts[0].trim();
  
  if (!finalTitle) {
    throw new Error('Release validation failed: Missing canonical title after normalization');
  }
  
  return finalTitle;
}`;

content = content.replace(regex1, replacement1);

const regex2 = /export const mapVideoToRelease = \(video: any, existing\?: CMSRelease \| null\): CMSRelease => \{\s*const title = video\.title \|\| video\.snippet\?\.title \|\| '';\s*const slug = existing\?\.slug \|\| buildUniqueSlug\(title, video\.id, existing\?\.id\);/g;

const replacement2 = `export const mapVideoToRelease = (video: any, existing?: CMSRelease | null): CMSRelease => {
    const rawTitle = video.title || video.snippet?.title || '';
    const governedCanonicalTitle = existing?.canonicalTitle || existing?.title || initializeCanonicalTitle(rawTitle);
    const slug = existing?.slug || buildUniqueSlug(governedCanonicalTitle, video.id, existing?.id);
    const title = rawTitle;`;

content = content.replace(regex2, replacement2);

const regex3 = /title: existing\?\.canonicalTitle \|\| existing\?\.title \|\| initializeCanonicalTitle\(title\),\s*canonicalTitle: existing\?\.canonicalTitle \|\| existing\?\.title \|\| initializeCanonicalTitle\(title\),\s*canonicalStatus: existing\?\.canonicalStatus \|\| 'inferred',/g;

const replacement3 = `title: governedCanonicalTitle,
    canonicalTitle: governedCanonicalTitle,
    canonicalStatus: existing?.canonicalStatus || (existing ? 'verified' : 'inferred'),`;

content = content.replace(regex3, replacement3);

fs.writeFileSync(file, content);
