const fs = require('fs');
const file = 'app/api/releases/route.ts';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import { PostgresReleaseRepository } from '@/server/db/release-repository';\n`;
if (!content.includes('PostgresReleaseRepository')) {
    content = importStatement + content;
}

const syncLogic = `
  if (searchParams.get('runDescSync') === '1') {
    const repo = new PostgresReleaseRepository();
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
        
        await repo.update(r.id, r);
        aligned++;
      } catch (e) {
        failures++;
      }
    }
    return NextResponse.json({ ytLinked, aligned, overrides, missing, failures });
  }
`;

content = content.replace(/(if \(searchParams\.get\('runDescSync'\) === '1'\) \{[\s\S]*?return NextResponse\.json\(\{ ytLinked, aligned, overrides, missing, failures \}\);\n  \})/, syncLogic);

fs.writeFileSync(file, content);
