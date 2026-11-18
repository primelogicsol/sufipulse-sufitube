const fs = require('fs');
const filePath = '.data/cms-releases.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let target;
if (Array.isArray(data)) {
  target = data.find(r => r.id === 'studio_draft_1794752884539_0eb391d5');
} else {
  target = data['studio_draft_1794752884539_0eb391d5'] || Object.values(data).find(r => r.id === 'studio_draft_1794752884539_0eb391d5');
}

if (!target) {
  console.error('Target release not found!');
  process.exit(1);
}

// 1. Description
target.description = [
  'Some People Leave Footprints Behind (कुछ लोग निशाँ छोड़ जाते हैं) | SufiPulse USA',
  'An original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA.\n\nSome People Leave Footprints Behind is a soulful reflection on those who make a difference through service, knowledge, compassion, courage, and quiet dedication—traveling through mountain trails, the writer’s inner world, the living dignity of Kashmir’s master artisans, fatherhood, and the enduring influence of those who help others turn ideas into meaningful action.\n\n“Some people leave footprints behind,\nNot carved in stone, but in our lives.”',
  'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.'
].join('\n\n');

// 2. Premiere Description
target.premiereDescription = "Some People Leave Footprints Behind (कुछ लोग निशाँ छोड़ जाते हैं) is an original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA. A soulful tribute to those who make a difference through service, knowledge, compassion, and quiet dedication—traveling through mountain trails, the writer's inner world, the living dignity of Kashmir's master craftspeople, fatherhood, and the enduring influence of those who uplift others without seeking personal recognition or royal acclaim. Not every legacy needs a monument; some lives are remembered through the good they leave behind.";

// 3. CTA Label
target.premiereCtaLabel = "Explore Footprints Behind";

// 4. Sponsors Intro
target.publicSponsorsIntro = "Support the cultural preservation and educational outreach of Some People Leave Footprints Behind, a SufiPulse USA original musical reflection by Dr. Zarf-e-Noori honoring Kashmir's master artisans, living craft traditions, and silent guardians. Verified contributions directly support authentic cultural documentation, artisan welfare advocacy, and global audience discovery. Sponsorship does not confer editorial control.";

// 5. SEO Keywords
target.seoKeywords = [
  'Some People Leave Footprints Behind',
  'Footprints Behind',
  'Kuchh Log Nishaan Chhod Jaate Hain',
  'कुछ लोग निशाँ छोड़ जाते हैं',
  'Dr. Zarf-e-Noori',
  'Mahmood Ahmad Shah',
  'SufiPulse USA',
  'Kashmir master artisans',
  'Kashmiri handicrafts',
  'Pashmina weavers',
  'Sozni embroidery Kashmir',
  'Kani shawl heritage',
  'Walnut wood carving Kashmir',
  'Craftlore',
  'KHCRF',
  'Sufi poetry',
  'Urdu Ghazal',
  'Spiritual altruism',
  'Silent guardians',
  'Living crafts of Kashmir',
  'Dignity of labor Sufism',
  'Mystical kalam SufiPulse'
];

// 6. Commentary Blocks
target.publicCommentary = [
  {
    id: 'studio_crafts_heritage',
    title: 'Living Crafts of Kashmir: Devotion Woven into Art',
    content: "The song honors the master weavers and artisans of Kashmir—the practitioners of Sozni embroidery, Kani shawls, Pashmina weaving, carpet knotting, and walnut wood carving. In the Sufi tradition, honest manual craftsmanship is not mere commerce; it is an act of spiritual presence and patience (sabr). The kalam affirms the dignity of these quiet masters whose hands sustain Kashmir's cultural legacy.",
    isPublished: true
  },
  {
    id: 'studio_mystical_altruism',
    title: 'Footprints in Living Hearts: The Ethos of Silent Service',
    content: "The central refrain, 'Na taaj ki khwaahish, na takht ka gumaan, bas dilon mein apna makaan chhod jaate hain,' expresses a core Sufi doctrine: the highest station of humanity is selfless service (khidmat) without the desire for worldly fame or royal recognition. True immortality is not built in stone monuments, but inscribed forever within the hearts and lives of those we uplift.",
    isPublished: true
  }
];

// 7. Credits
target.publicCredits = {
  artistic: {
    leadVocalist: 'SufiPulse Vocal Ensemble',
    lyricist: 'Dr. Zarf-e-Noori',
    composer: 'Dr. Zarf-e-Noori',
    musicProducer: 'Dr. Zarf-e-Noori / SufiPulse USA',
    backgroundVocals: 'Chorus'
  },
  production: {
    productionSupervision: 'SufiPulse Studio USA',
    specialMusicalAppreciation: 'Mahmood Ahmad Shah'
  },
  visual: {
    artwork: 'SufiPulse Studio USA',
    videoDirection: 'SufiPulse Studio USA'
  },
  literary: {
    conceptAndSongwriting: 'Dr. Zarf-e-Noori',
    thematicInterpretation: 'Dr. Zarf-e-Noori',
    englishTranslation: 'SufiPulse Editorial Board'
  },
  rights: {
    publishedBy: 'SufiPulse USA',
    platform: 'SufiTube',
    copyrightHolder: 'SufiPulse USA',
    licensingText: 'Standard SufiPulse License',
    registeredReleaseId: 'SP-KS-2026-024'
  }
};

target.updatedAt = new Date().toISOString();

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated .data/cms-releases.json with all authentic fields!');
