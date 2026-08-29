const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

// The function signature: export const mapVideoToRelease = (video: any, existing?: CMSRelease | null, resolutions?: Record<string, "youtube" | "cms">): CMSRelease => {
content = content.replace(/export const mapVideoToRelease = \(video: any, existing\?: CMSRelease \| null\): CMSRelease => \{/g, `export const mapVideoToRelease = (video: any, existing?: CMSRelease | null, resolution?: 'youtube' | 'cms'): CMSRelease => {`);

// For the title mapping:
content = content.replace(/const governedCanonicalTitle = existing\?\.canonicalTitle \|\| existing\?\.title \|\| initializeCanonicalTitle\(rawTitle\);/g, `const governedCanonicalTitle = existing?.canonicalTitle || existing?.title || initializeCanonicalTitle(rawTitle);
    
    // If the user explicitly chose to use YouTube's metadata to overwrite CMS:
    const finalTitle = resolution === 'youtube' ? rawTitle : governedCanonicalTitle;
    const finalDescription = resolution === 'youtube' ? (video.description || video.snippet?.description || '') : (existing?.description || video.description || video.snippet?.description || '');`);

content = content.replace(/title: governedCanonicalTitle,/g, `title: finalTitle,`);
content = content.replace(/canonicalTitle: governedCanonicalTitle,/g, `canonicalTitle: finalTitle,`);
content = content.replace(/description: existing\?\.description \|\| video\.description \|\| video\.snippet\?\.description \|\| '',/g, `description: finalDescription,
      youtubeDescription: video.description || video.snippet?.description || '',`);

// Metadata status
content = content.replace(/metadataStatus: existing\?\.canonicalTitle && existing\.canonicalTitle\.trim\(\)\.toLowerCase\(\) !== title\.trim\(\)\.toLowerCase\(\)[\s\S]*?: 'synced',/g, `metadataStatus: resolution === 'cms' ? 'overridden' : (resolution === 'youtube' ? 'synced' : (existing?.metadataStatus || 'synced')),`);

fs.writeFileSync(file, content);
