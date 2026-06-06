import { entityStore } from '../lib/atlas/atlas-entity';

const newDescriptions: Record<string, string> = {
  'nund-rishi': "The spiritual voice most closely associated with Kashmir's Rishi tradition. His teachings on humility, service, and harmony continue to shape Kashmiri spiritual identity centuries later.",
  'lal-ded': "A mystic poet whose verses transcended religious boundaries and became part of Kashmir's shared cultural memory.",
  'bayazid-bastami': "One of the earliest and most influential mystics in the Sufi tradition, remembered for his teachings on spiritual annihilation (Fana) and closeness to the Divine.",
  'qawwali': "A devotional musical tradition that transforms poetry, remembrance, and spiritual longing into a collective listening experience.",
  'shah-hamadan': "A revered 14th-century Persian Sufi who transformed Kashmir's spiritual and socio-cultural landscape, bringing teachings of divine unity and compassion.",
  'kashmiri-sufiyana': "A classical choral music tradition from Kashmir that uniquely blends Persian and Indian elements to recite the verses of profound mystic poets.",
  'nusrat-fateh-ali-khan': "The legendary Qawwali maestro who introduced the ecstatic, spiritual intensity of Sufi devotional music to global audiences while fiercely preserving its sacred roots.",
  'abida-parveen': "Celebrated globally as the Queen of Sufi Music, her trance-inducing performances of classical Kafis evoke the deepest forms of divine love and surrender.",
  'tajdar-e-haram': "An iconic and deeply passionate Qawwali composition dedicated to the Prophet Muhammad, renowned for its hypnotic rhythm and emotional plea for grace.",
  'sufi-music': "A diverse, global collection of musical traditions aimed at dissolving the ego and attaining spiritual purity through sound, rhythm, and poetry."
};

async function seedShortDescriptions() {
  console.log('✍️ Updating short descriptions for flagship entities...');
  
  const allEntities = entityStore.findAll();
  let updatedCount = 0;

  for (const entity of allEntities) {
    if (newDescriptions[entity.slug]) {
      entityStore.update(entity.id, {
        shortDescription: newDescriptions[entity.slug]
      });
      console.log(`✅ Updated short description: ${entity.canonicalName}`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Short descriptions upgrade complete: ${updatedCount} entities processed.`);
}

seedShortDescriptions().catch(console.error);
