import { cmsServerStorage } from '../lib/cms-storage-server';

async function test() {
  try {
    console.log('Fetching all releases...');
    const releases = cmsServerStorage.getAllReleases();
    console.log(`Success: Found ${releases.length} releases`);
  } catch (err) {
    console.error('FAILED TO FETCH RELEASES:');
    console.error(err);
  }
}

test();
