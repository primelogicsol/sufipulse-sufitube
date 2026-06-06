import { entityStore } from '../lib/atlas/atlas-entity';
import { relationshipStore } from '../lib/atlas/atlas-relationship';
import { AtlasEntity, EntityStatus } from '../lib/atlas/atlas-types';

function isPlaceholderEntity(entity: AtlasEntity): boolean {
  return /^(Saint|Singer|Album|Concept|Channel|Poet|Song)\s+\d+$/i.test(entity.canonicalName);
}

function isDemoRelease(entity: AtlasEntity): boolean {
  const demoTitles = [
    'Kashmiri Sufiana Demo',
    'Tajdar-e-Haram Interpretation',
    'Rumi Session',
    'Qawwali Masterclass'
  ];
  return demoTitles.some(title => entity.canonicalName.includes(title));
}

async function runQualitySweep() {
  console.log('🧹 Running Quality Sweep...');
  const allEntities = entityStore.findAll();

  let hiddenCount = 0;
  let demoDeletedCount = 0;

  for (const entity of allEntities) {
    // 1. Hide Placeholder Entities
    if (isPlaceholderEntity(entity)) {
      entityStore.update(entity.id, {
        status: 'review',
        isPublic: false,
        isActive: false
      });
      hiddenCount++;
    }

    // 2. Hide/Delete Demo Releases
    if (entity.entityType === 'release' && isDemoRelease(entity)) {
      entityStore.update(entity.id, {
        status: 'review',
        isPublic: false,
        isActive: false
      });
      demoDeletedCount++;
      
      // Remove relationships to this demo release
      const edges = relationshipStore.findAll().filter(e => e.sourceEntityId === entity.id || e.targetEntityId === entity.id);
      for (const edge of edges) {
        relationshipStore.delete(edge.id);
      }
    }
  }

  console.log(`✅ Hidden ${hiddenCount} placeholder entities from public view.`);
  console.log(`✅ Hidden ${demoDeletedCount} demo releases and purged their connections.`);

  // 3. Editorial pass on Abida Parveen
  const abida = allEntities.find(e => e.slug === 'abida-parveen');
  if (abida) {
    entityStore.update(abida.id, {
      sufipulseJustification: "Abida Parveen is widely regarded as one of the most influential living voices in Sufi music. Her performances of the poetry of Bulleh Shah, Shah Abdul Latif Bhittai, Sachal Sarmast, and Kabir have introduced generations of listeners to the spiritual traditions of South Asia.",
      sufipulseInterpretation: "SufiPulse views Abida Parveen not simply as a singer, but as one of the most important living custodians of South Asia's mystical poetic tradition. Her work demonstrates how music can function as transmission rather than entertainment, carrying centuries-old spiritual teachings into contemporary audiences.",
      authorityMetadata: {
        born: '1954',
        region: 'Sindh, Pakistan',
        languages: ['Sindhi', 'Punjabi', 'Urdu', 'Saraiki'],
        primaryGenres: ['Kafi', 'Ghazal', 'Sufi Rock'],
        knownFor: ['Trance-inducing vocal power', 'Global popularization of Kafi singing'],
        associatedPoets: ['Bulleh Shah', 'Shah Abdul Latif Bhittai', 'Kabir'],
        associatedTraditions: ['Sindhi Sufism']
      }
    });
    console.log(`✅ Refined Abida Parveen with unique editorial voice and extended metadata.`);
  }

  // Also do Nund Rishi
  const nund = allEntities.find(e => e.slug === 'nund-rishi');
  if (nund) {
    entityStore.update(nund.id, {
      sufipulseJustification: "Nund Rishi is the spiritual voice most closely associated with Kashmir's Rishi tradition. His teachings on humility, service, and harmony continue to shape Kashmiri spiritual identity centuries later.",
      sufipulseInterpretation: "SufiPulse interprets Nund Rishi not just as a historical saint, but as the architect of Kashmir's spiritual and ecological conscience. Through our original release, we revive his verses (Shruks) using traditional authentic instrumentation to remind the modern seeker of his message of universal brotherhood.",
      authorityMetadata: {
        born: '1377',
        region: 'Kashmir',
        languages: ['Kashmiri'],
        primaryGenres: ['Shruk (Spiritual Quatrains)'],
        knownFor: ['Founding the Rishi order', 'Patron saint of Kashmir', 'Kashmiriyat'],
        associatedTraditions: ['Rishi Order', 'Kashmir Shaivism']
      }
    });
    console.log(`✅ Refined Nund Rishi with unique editorial voice and extended metadata.`);
  }

  console.log('\n🎉 Quality sweep complete. The graph is now editorially pristine.');
}

runQualitySweep().catch(console.error);
