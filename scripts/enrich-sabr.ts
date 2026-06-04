import { registriesStorage } from '../lib/registries-storage';
import { cmsServerStorage } from '../lib/cms-storage-server';
import { graphResolver } from '../lib/graph-resolver';

async function enrich() {
  console.log('--- ENRICHING SABR CONCEPT NODE ---');

  // Hydrate
  registriesStorage.forceHydrate();
  cmsServerStorage.forceHydrate();
  graphResolver.forceHydrate();

  // 1. Enrich the 'sabr' registry item
  const sabrItem = {
    slug: 'sabr',
    title: 'Sabr (Spiritual Patience)',
    synonyms: ['patience', 'endurance', 'self-control', 'sabar', 'resignation to Divine Will'],
    description: 'Sabr represents the foundational spiritual station (maqam) of patience, steadfastness, and self-restraint. It is the active preservation of the soul\'s equilibrium when facing trials, delays, or spiritual waiting, anchoring the seeker\'s reliance on God.',
    theologicalNotes: 'In Tasawwuf (Sufism), Sabr is not a passive resignation, but an active, noble state of alignment with the Divine Decree. Hazrat Ali stated that Sabr is to faith what the head is to the body. Sufi poets, particularly Jalaluddin Rumi, write of Sabr as the key to inner alchemy, transforming raw suffering into spiritual gold. It is coupled with Shukr (gratitude) as the two wings of the seeker\'s journey.',
    isActive: true,
    isPublic: true,
    wikidataId: 'Q3359005',
    externalRefs: {
      wikidata: 'Q3359005',
      wikipedia: 'https://en.wikipedia.org/wiki/Sabr',
      britannica: 'https://www.britannica.com/topic/Sabr',
      other: []
    }
  };

  const savedRegistry = registriesStorage.saveItem('concepts', sabrItem as any);
  console.log('✅ Sabr registry item enriched:', savedRegistry);

  // 2. Link to a release (e.g., Aahista Aahista)
  const releases = cmsServerStorage.getAllReleases();
  const targetRelease = releases.find(r => r.slug.startsWith('aahista-aahista'));

  if (targetRelease) {
    console.log(`Found target release: ${targetRelease.title}`);
    targetRelease.sufiConcepts = ['sabr'];
    // Let's also tag a theme for overlap testing
    targetRelease.themes = ['spiritual-journey'];
    targetRelease.status = 'published'; // Make sure it's published so it shows on public API/UI

    const savedRelease = cmsServerStorage.saveRelease(targetRelease);
    console.log(`✅ Linked Sabr concept & Spiritual Journey theme to release: ${savedRelease.title}`);
  } else {
    console.warn('⚠️ No release starting with "aahista-aahista" found to link.');
  }

  console.log('--- ENRICHMENT COMPLETE ---');
}

enrich().catch(console.error);
