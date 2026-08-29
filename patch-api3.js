const fs = require('fs');
function updateEndpoint(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/cmsReleaseId: existing\?\.id \?\? null,/g, `cmsReleaseId: existing?.id ?? null,
        cmsData: existing ? {
          title: existing.title,
          description: existing.description,
          youtubeTitle: existing.youtubeTitle
        } : null,`);
  fs.writeFileSync(file, content);
}
updateEndpoint('app/api/releases/import-youtube/route.ts');
updateEndpoint('app/api/releases/import-youtube/live/route.ts');
// Note: Playlists don't use 'existing' the exact same way but they might.
