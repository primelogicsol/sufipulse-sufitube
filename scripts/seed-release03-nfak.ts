import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';

const DATA_DIR = path.join(process.cwd(), '.data');
const RELEASES_FILE = path.join(DATA_DIR, 'cms-releases.json');

const markdownContent = fs.readFileSync(path.join(process.env.HOME || process.env.USERPROFILE || '', '.gemini/antigravity-cli/brain/f63e2fab-4304-41ad-b9fb-af19e2c13561/release03_nfak_intelligence.md'), 'utf8');

async function run() {
  console.log('🚀 Injecting Release 03: Nusrat Fateh Ali Khan into CMS...');
  
  if (!fs.existsSync(RELEASES_FILE)) {
    fs.writeFileSync(RELEASES_FILE, JSON.stringify([]));
  }
  
  const releasesData = fs.readFileSync(RELEASES_FILE, 'utf-8');
  let releases = JSON.parse(releasesData);
  
  const newReleaseId = `rel_${crypto.randomUUID()}`;
  
  const release03 = {
    id: newReleaseId,
    title: 'Nusrat Fateh Ali Khan and the Globalization of Qawwali',
    slug: 'nfak-and-the-globalization-of-qawwali',
    releaseDate: new Date().toISOString(),
    status: 'published',
    contentReadinessState: 'ready',
    publicCommentary: markdownContent,
    description: "How the 'Shahenshah-e-Qawwali' bridged the courtyards of the Chishti saints with the stages of global world music.",
    format: 'video',
    releaseType: 'flagship',
    visibility: 'public',
    enableLyrics: true,
    enableCommentary: true,
    enableSponsors: true,
    enableAdoption: true,
    enableCredits: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existingIndex = releases.findIndex((r: any) => r.slug === 'nfak-and-the-globalization-of-qawwali');
  if (existingIndex > -1) {
    releases[existingIndex] = { ...releases[existingIndex], ...release03 };
    console.log('✅ Updated existing Release 03 in CMS.');
  } else {
    releases.push(release03);
    console.log('✅ Inserted Release 03 into CMS.');
  }

  const tempPath = `${RELEASES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(releases, null, 2));
  fs.renameSync(tempPath, RELEASES_FILE);

  const entity = entityStore.findBySlug('nusrat-fateh-ali-khan');
  if (entity) {
    const currentReleases = new Set(entity.connectedReleaseIds || []);
    currentReleases.add(newReleaseId);
    
    entityStore.update(entity.id, {
      connectedReleaseIds: Array.from(currentReleases)
    });
    console.log('✅ Connected Release 03 to Atlas Entity: Nusrat Fateh Ali Khan.');
  } else {
    console.log('⚠️ Could not find Nusrat Fateh Ali Khan in Atlas Entity Store.');
  }
  
  console.log('🎉 Release 03 injection complete!');
}

run().catch(console.error);
