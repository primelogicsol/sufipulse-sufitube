import { cmsServerStorage } from './lib/cms-storage-server';
import { entityGetAll } from './lib/entity-storage-server';

const zarf = entityGetAll('writers').find((w: any) => w.public_name === 'Dr. Zarf-e-Noori' || w.name === 'Dr. Zarf-e-Noori');
if (!zarf) throw new Error('Zarf-e-Noori not found in writers');

const releases = cmsServerStorage.getAllReleases();
let updated = 0;

for (const release of releases) {
  if (!release.writer && !release.lyricist) {
    // Only update if there's no writer at all
    cmsServerStorage.saveRelease({
      ...release,
      writer: zarf.id,
      lyricist: zarf.id
    });
    updated++;
  }
}

console.log(`Successfully updated ${updated} releases to use canonical writer ID: ${zarf.id}`);
