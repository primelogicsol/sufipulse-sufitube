/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS — Entity Authority Metadata Enrichment
 * ═══════════════════════════════════════════════════════════════════
 * Adds institutional context to flagships.
 */

import { entityStore } from '../lib/atlas/atlas-entity';

const metadataContent: Record<string, any> = {
  'nund-rishi': { era: '14th Century', region: 'Kashmir', tradition: 'Rishi Order', relatedConcepts: ['Kashmiriyat', 'Vegetarianism', 'Cosmic Harmony'] },
  'lal-ded': { era: '14th Century', region: 'Kashmir', tradition: 'Kashmir Shaivism / Sufism', relatedConcepts: ['Vakhs', 'Asceticism', 'Divine Unity'] },
  'shah-hamadan': { era: '14th Century', region: 'Persia / Kashmir', tradition: 'Kubrawiya Order', relatedConcepts: ['Islam in Kashmir', 'Artisanal Guilds'] },
  'kashmiri-sufiyana': { era: '15th Century onwards', region: 'Kashmir', tradition: 'Sufiyana Kalam', relatedConcepts: ['Maqam System', 'Santoor', 'Choral Devotion'] },
  'bayazid-bastami': { era: '9th Century', region: 'Persia', tradition: 'Tayfuriya / Early Asceticism', relatedConcepts: ['Fana', 'Baqa', 'Shathiyat (Ecstatic Utterances)'] },
  'qawwali': { era: '13th Century', region: 'South Asia', tradition: 'Chishti Order', relatedConcepts: ['Sama', 'Spiritual Ecstasy', 'Zikr'] },
  'sufi-music': { era: '8th Century onwards', region: 'Global', tradition: 'Pan-Sufism', relatedConcepts: ['Divine Love', 'Sama', 'Inner Purification'] },
  'nusrat-fateh-ali-khan': { era: '20th Century', region: 'Pakistan', tradition: 'Qawwali', relatedConcepts: ['Sama', 'Improvisation', 'Global World Music'] },
  'abida-parveen': { era: '20th/21st Century', region: 'Pakistan', tradition: 'Sindhi Sufism / Kafi', relatedConcepts: ['Divine Intoxication', 'Kafi', 'Wajd'] },
  'tajdar-e-haram': { era: '20th Century', region: 'Pakistan', tradition: 'Qawwali', relatedConcepts: ['Naat', 'Devotion to Prophet', 'Intercession'] }
};

async function seedMetadata() {
  console.log('🏛️ Seeding Authority Metadata...');
  
  const allEntities = entityStore.findAll();
  let count = 0;

  for (const entity of allEntities) {
    if (metadataContent[entity.slug]) {
      entityStore.update(entity.id, {
        authorityMetadata: metadataContent[entity.slug]
      });
      console.log(`✅ Updated Metadata: ${entity.canonicalName}`);
      count++;
    }
  }

  console.log(`\\n🎉 Metadata Upgrade Complete: ${count} entities processed.`);
}

seedMetadata().catch(console.error);
