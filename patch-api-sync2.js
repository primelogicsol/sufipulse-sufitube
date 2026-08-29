const fs = require('fs');
const file = 'app/api/releases/route.ts';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import { youtubeService } from '@/lib/youtube-service';\nimport { getReleaseWriteStore } from '@/server/storage/release-write-backend';\n`;
if (!content.includes('youtubeService')) {
    content = importStatement + content;
}

const syncLogic = `
  if (searchParams.get('runDescSync') === '1') {
    const writer = getReleaseWriteStore();
    const repo = getReleaseReadStore();
    const releases = await repo.query({ status: 'published', limit: 1000 });
    
    let ytLinked = 0; let aligned = 0; let overrides = 0; let missing = 0; let failures = 0;
    
    for (const r of releases.items) {
      if (!r.youtubeId) continue;
      ytLinked++;
      try {
        const video = await youtubeService.getVideoById(r.youtubeId);
        if (!video) { missing++; continue; }
        const liveDescription = video.description || '';
        const isOverride = !!r.descriptionOverride;
        r.youtubeDescription = liveDescription;
        if (!isOverride) r.description = liveDescription;
        else overrides++;
        
        await writer.saveRelease(r);
        aligned++;
      } catch (e) {
        failures++;
      }
    }
    return NextResponse.json({ ytLinked, aligned, overrides, missing, failures });
  }
`;

content = content.replace(/(export async function GET\(request: NextRequest\) \{[\s\S]*?const \{ searchParams \} = new URL\(request\.url\);)/, `$1\n${syncLogic}`);

fs.writeFileSync(file, content);
