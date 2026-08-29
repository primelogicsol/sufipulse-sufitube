const fs = require('fs');

function updateEndpoint(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Update POST signature and mapVideoToRelease call
  content = content.replace(/const body = await request\.json\(\)\.catch\(\(\) => \(\{\}\)\);/, `const body = await request.json().catch(() => ({}));
      const resolutions = body.resolutions || {}; // { [videoId]: 'youtube' | 'cms' }`);
  
  content = content.replace(/const mapped = mapVideoToRelease\(video, existing\);/g, `const mapped = mapVideoToRelease(video, existing, resolutions[video.id]);`);
  
  // Fix getMismatchFields
  const mismatchRegex = /function getMismatchFields\(existing: CMSRelease, video: any\): string\[\] \{[\s\S]*?return fields;\s*\}/g;
  const newMismatch = `function getMismatchFields(existing: CMSRelease, video: any): string[] {
    const fields: string[] = [];
    const liveTitle = video.title || video.snippet?.title || '';
    const liveDescription = video.description || video.snippet?.description || '';
  
    if (existing.youtubeTitle !== undefined) {
      if (normalizeText(existing.youtubeTitle) !== normalizeText(liveTitle)) fields.push('title');
    } else {
      if (normalizeText(existing.title) !== normalizeText(liveTitle)) fields.push('title');
    }
    
    if (existing.youtubeDescription !== undefined) {
      if (normalizeText(existing.youtubeDescription) !== normalizeText(liveDescription)) fields.push('description');
    } else {
      if (normalizeText(existing.description) !== normalizeText(liveDescription)) fields.push('description');
    }
  
    return fields;
  }`;
  content = content.replace(mismatchRegex, newMismatch);

  fs.writeFileSync(file, content);
}

updateEndpoint('app/api/releases/import-youtube/route.ts');
updateEndpoint('app/api/releases/import-youtube/live/route.ts');

