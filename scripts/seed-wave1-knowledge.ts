/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS — Wave 1 Flagship Knowledge Enrichment
 * ═══════════════════════════════════════════════════════════════════
 * Upgrades the 10 wave 1 flagship entities from basic text to structured,
 * authoritative markdown formatting (Biography, Legacy, Influence, etc.)
 */

import { entityStore } from '../lib/atlas/atlas-entity';

const enrichedContent: Record<string, string> = {
  'nund-rishi': `## Biography\n\nNund Rishi, also known as Sheikh Noor-ud-Din Wali, is the patron saint of Kashmir and the founder of the Rishi order of Sufis. Born in the 14th century, his life was marked by profound asceticism and a dedication to spiritual awakening.\n\n## Spiritual Philosophy & Legacy\n\nHis teachings, encapsulated in his poetic verses known as *Shruks*, emphasize cosmic harmony, vegetarianism, and universal brotherhood, deeply influencing the syncretic culture of Kashmir (Kashmiriyat).\n\n## Influence on Modern Sufi Music\n\nToday, his verses form the spiritual backbone of many traditional Kashmiri Sufiyana compositions and modern Sufi music interpretations, preserving his mystical wisdom for generations.`,
  
  'lal-ded': `## Biography\n\nLal Ded, or Lalleshwari, was a 14th-century mystic poet from Kashmir. Leaving her conventional life, she wandered naked, reciting her mystical quatrains (vakhs) and embodying the path of an ascetic.\n\n## Spiritual Philosophy & Legacy\n\nHer *vakhs* are considered the earliest compositions in the Kashmiri language and serve as a monumental pillar in both Shaivism and Sufism, highlighting a direct, unmediated experience of the divine.\n\n## Influence on Modern Sufi Music\n\nLal Ded's poetry continues to be a central repertoire for traditional singers and contemporary Sufi artists, illustrating the timeless quest for inner truth.`,
  
  'shah-hamadan': `## Biography\n\nMir Sayyid Ali Hamadani, revered as Shah-e-Hamadan, was a prominent Persian Sufi of the Kubrawiya order who played a pivotal role in bringing Islam to Kashmir in the 14th century.\n\n## Legacy and Contributions\n\nHe is credited not only with widespread spiritual conversions but also with introducing vital crafts, industries, and architectural styles to the region, fundamentally shaping Kashmir's socio-cultural landscape.\n\n## Traditions\n\nThe profound devotion to Shah Hamadan is celebrated through localized Sufi rituals, poetry, and musical gatherings that echo his teachings of compassion and divine unity.`,
  
  'kashmiri-sufiyana': `## Musical Tradition\n\nKashmiri Sufiyana Kalam is a classical music tradition unique to Kashmir, characterized by its intricate choral singing and the use of indigenous instruments like the Santoor, Saaz-e-Kashmir, and Kashmiri Setar.\n\n## Origins and Evolution\n\nBlending Persian and Indian classical elements, this tradition emerged in the courts of Kashmir and became the primary medium for reciting the poetry of Sufi saints like Lal Ded and Nund Rishi.\n\n## Modern Resurgence\n\nWhile facing risks of decline, modern efforts by institutions and dedicated artists have sought to revitalize Sufiyana, ensuring the preservation of its distinct *maqam* system and spiritual resonance.`,
  
  'bayazid-bastami': `## Biography\n\nBayazid Bastami (Tafur Abu Yazid al-Bistami) was a 9th-century Persian Sufi who became one of the most famous figures in early Islamic mysticism, renowned for his intense, ecstatic states.\n\n## The Concept of Fana\n\nHe is famously associated with the concept of *Fana* (annihilation of the self in the Divine). His bold, ecstatic utterances (shathiyat) broke conventional boundaries and laid the groundwork for later ecstatic Sufism.\n\n## Influence on Devotional Art\n\nBastami's profound spiritual experiences and teachings of absolute surrender have inspired countless Sufi poets and musicians, embedding the theme of *Fana* deeply into the global Sufi musical tradition.`,
  
  'qawwali': `## The Art of Sama\n\nQawwali is the vibrant, energetic form of Sufi devotional music prominent in South Asia. Originating in the 13th century, it serves as a medium to induce *Sama*—a state of spiritual ecstasy and communion with the Divine.\n\n## Musical Structure and Themes\n\nA typical Qawwali performance builds from a slow, meditative prelude into an intense, rhythmic crescendo. The lyrics, spanning Persian, Urdu, and Punjabi, revolve around divine love, praise of the Prophet, and the spiritual intoxication of the saints.\n\n## Global Impact\n\nPopularized globally by legends like Nusrat Fateh Ali Khan, Qawwali has transcended its traditional shrine origins to become a celebrated world music genre, spreading the message of Sufism across continents.`,
  
  'sufi-music': `## The Soundtrack of Spiritual Seeking\n\nSufi music is not a single genre but a vast, global collection of musical traditions aimed at attaining spiritual purity and closeness to God through sound and rhythm.\n\n## Diverse Expressions\n\nFrom the hypnotic whirls of the Mevlevi order in Turkey to the rhythmic pulses of Senegalese Zikr and the explosive energy of South Asian Qawwali, Sufi music takes countless forms, adapting to the cultural heartbeats of its regions.\n\n## Core Philosophy\n\nAt its core, Sufi music treats the voice and instruments as vessels for divine expression, aiming to awaken the soul and dissolve the ego in the vast ocean of divine love.`,
  
  'nusrat-fateh-ali-khan': `## Biography\n\nUstad Nusrat Fateh Ali Khan (1948–1997) was a legendary Pakistani vocalist and musician, primarily a singer of Qawwali. Hailing from a 600-year-old lineage of Qawwals, he possessed an extraordinary vocal range and an unmatched ability to convey raw spiritual emotion.\n\n## Musical Journey and Innovation\n\nNusrat revolutionized Qawwali by introducing it to international audiences, collaborating with Western artists, and experimenting with tempo and composition while fiercely maintaining the genre's sacred essence.\n\n## Influence on Modern Sufi Music\n\nHis legacy is monumental. He is widely considered the greatest Qawwal in history, whose recordings remain the gold standard for vocal improvisation, spiritual intensity, and cross-cultural musical dialogue.`,
  
  'abida-parveen': `## Biography\n\nAbida Parveen is one of the foremost exponents of Sufi vocal music, celebrated as the "Queen of Sufi Music." Born in Sindh, Pakistan, she has dedicated her life to the ecstatic singing of Sufi poetry.\n\n## Musical Style\n\nKnown for her deep, resonant voice and powerful, trance-inducing performances, she specializes in singing *Kafis* and ghazals of mystics like Bulleh Shah, Shah Abdul Latif Bhittai, and Kabir.\n\n## Enduring Legacy\n\nHer ability to cross linguistic and cultural barriers through the sheer emotional force of her singing has made her a global ambassador for Sufism, inspiring a profound sense of divine love in her listeners.`,
  
  'tajdar-e-haram': `## The Composition\n\n*Tajdar-e-Haram* ("King of the Sanctuary") is an iconic Qawwali originally performed and popularized by the Sabri Brothers. It is a passionate ode of devotion to the Prophet Muhammad.\n\n## Cultural Significance\n\nThe Qawwali has achieved an immortal status in South Asia, characterized by its hypnotic rhythm and deeply emotional plea for intercession and divine grace.\n\n## Influence on Modern Sufi Music\n\nIts modern reinterpretations have reached tens of millions, demonstrating the timeless appeal of the composition and its unique ability to bridge the gap between classical Sufi devotion and contemporary musical tastes.`
};

async function seedKnowledge() {
  console.log('📚 Upgrading Wave 1 Flagship Knowledge...');
  
  const allEntities = entityStore.findAll();
  let upgradedCount = 0;

  for (const entity of allEntities) {
    if (enrichedContent[entity.slug]) {
      entityStore.update(entity.id, {
        longDescription: enrichedContent[entity.slug]
      });
      console.log(`✅ Enriched: ${entity.canonicalName}`);
      upgradedCount++;
    }
  }

  console.log(`\\n🎉 Knowledge Upgrade Complete: ${upgradedCount} flagship entities enriched with authoritative markdown.`);
}

seedKnowledge().catch(console.error);
