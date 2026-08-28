const fs = require('fs');
const path = require('path');

// Curated Canonical Metadata Dictionary by YouTube ID or Slug or ID
const CANONICAL_CATALOGUE = {
  'Dbd0fhJty4A': {
    canonicalTitle: 'Ik Khamoshi, Tu Aur Main',
    subtitle: 'Mystical Kalam • Ishq • Fanā • Baqā',
    governanceOrigin: 'native_governed',
  },
  'aMzdiIuYgK4': {
    canonicalTitle: 'Take Control – A Ramadan Prayer',
    subtitle: 'Ramadan Reset Reflection',
    governanceOrigin: 'native_governed',
  },
  'g9VGzWRHZ0g': {
    canonicalTitle: 'Aaja Sufi Ban Ja',
    subtitle: 'Step Away From Ego',
    governanceOrigin: 'native_governed',
  },
  '_zx1N_xZzys': {
    canonicalTitle: 'Nazar-e-Karam Kar De',
    subtitle: 'A Prayer for Inner Elevation',
    governanceOrigin: 'native_governed',
  },
  'n6q_g4bY_sA': {
    canonicalTitle: 'Main Hoon Sufi Researcher',
    subtitle: 'A Sufi Reflection for Those Who Study the World',
    governanceOrigin: 'native_governed',
  },
  'lMxb4Dk-n0Y': {
    canonicalTitle: 'Ya Dost – Asma Se Qalb Tak',
    subtitle: 'How Divine Names Shape the Heart',
    governanceOrigin: 'native_governed',
  },
  'QkGzXGrEllo': {
    canonicalTitle: 'Haji Naam Mila, Par Badla Kya?',
    subtitle: 'The Journey Within',
    governanceOrigin: 'native_governed',
  },
  'FelED4DBHCk': {
    canonicalTitle: 'Zair-o-Zabar Ka Jalwa',
    subtitle: "Qira'at-e-Qur'an That Awakens the Soul",
    governanceOrigin: 'native_governed',
  },
  'k0D188oBZ1Y': {
    canonicalTitle: 'Khwaja Mere Khwaja',
    subtitle: 'A Devotional Adaptation',
    governanceOrigin: 'native_governed',
  },
  'sPOY59RAkAU': {
    canonicalTitle: 'A-las-tu Ki Goonj',
    subtitle: 'Rab Ki Khamoshi Mein Rooh',
    governanceOrigin: 'native_governed',
  },
  '24SrdzzLYus': {
    canonicalTitle: 'Gardish',
    subtitle: 'Rab Ki Khamosh Daleel • The Inescapable Cycle',
    governanceOrigin: 'native_governed',
  },
  'XPaJu3lHd5Y': {
    canonicalTitle: 'Ye Lakeerein Nahi, Lauh-e-Mehfooz Ki Tahrirein',
    subtitle: 'A Sufi Reflection on Destiny',
    governanceOrigin: 'native_governed',
  },
  'LwnPXSEJJHI': {
    canonicalTitle: 'Sufi Hacker – Dil Ka Code Reader',
    subtitle: 'For Developers and Seekers',
    governanceOrigin: 'native_governed',
  },
  'be6GFwGpobw': {
    canonicalTitle: 'Needle to Noor (Saada-e-Najaat)',
    subtitle: 'Voice for the Mubtala',
    governanceOrigin: 'native_governed',
  },
  '8nmW-vJbwMA': {
    canonicalTitle: 'SufiPulse Studio Session – 13 January 2026',
    subtitle: 'Sacred Recording Session',
    governanceOrigin: 'native_governed',
  },
  'M-2q5v6wE94': {
    canonicalTitle: 'SufiPulse Master Session – 17 January 2026',
    subtitle: 'Studio Archive',
    governanceOrigin: 'native_governed',
  },
  'jOQ2KzI_lSg': {
    canonicalTitle: 'SufiPulse Studio Session – 22 January 2026',
    subtitle: 'Studio Archive',
    governanceOrigin: 'native_governed',
  },
  'o4q5u_c7_1w': {
    canonicalTitle: 'SufiPulse Master Session – 24 January 2026',
    subtitle: 'Studio Archive',
    governanceOrigin: 'native_governed',
  },
  'Qv6VqX_E-2k': {
    canonicalTitle: 'SufiPulse Live Session – 27 January 2026',
    subtitle: 'Studio Archive',
    governanceOrigin: 'native_governed',
  },
  'G8_2u9w-4x0': {
    canonicalTitle: 'SufiPulse Studio Session – 29 January 2026',
    subtitle: 'Studio Archive',
    governanceOrigin: 'native_governed',
  },
  'Sp4cG8TI7i8': {
    canonicalTitle: 'A Global Movement of Sufi Poetry & Music',
    subtitle: 'Institutional Movement Anthem',
    governanceOrigin: 'native_governed',
  },
  'nn3gXZQqX84': {
    canonicalTitle: 'صوفی پلس | عالمی تحریک',
    subtitle: 'عالمی صوفی تحریک',
    governanceOrigin: 'native_governed',
  },
  '_BxraDL7kS0': {
    canonicalTitle: 'Korthas Aye Sanam',
    subtitle: 'Breaking All Measures of Longing',
    governanceOrigin: 'native_governed',
  },
  'kVtYDOa5hPs': {
    canonicalTitle: 'Dapyomas Baalyaaras Yaaer Laagav',
    subtitle: "I Told My Beloved, Let's Begin A Friendship",
    governanceOrigin: 'native_governed',
  },
  'Ykx2PwA4mOk': {
    canonicalTitle: 'Al-Razzāq',
    subtitle: 'Rozi Sirf Tujh Se Hai',
    governanceOrigin: 'native_governed',
  },
  'srM451HZEOE': {
    canonicalTitle: 'Yeh Ummat Hai Ya Khwaab Ka Dhoka?',
    subtitle: 'Sacred Reflection',
    governanceOrigin: 'native_governed',
  },
  'p2SWi4XduOU': {
    canonicalTitle: 'Mansur – Jala! Mita! Bana! Saja!',
    subtitle: 'Sacred Kalam',
    governanceOrigin: 'native_governed',
  },
  'CcCVyM3G7JE': {
    canonicalTitle: 'Dapyomas Baleyaaras Yaar Laagav',
    subtitle: 'Kashmiri Sacred Kalam',
    governanceOrigin: 'native_governed',
  },
  'BzcmOqiIHck': {
    canonicalTitle: 'SufiPulse Global Reach & YouTube Intelligence',
    subtitle: 'Audience Insight Overview',
    governanceOrigin: 'native_governed',
  },
  'hbe-e1x1yAU': {
    canonicalTitle: 'Dapyomas Baleyaaras Yaar Laagav',
    subtitle: "Vessels of the Soch Kral's Flame",
    governanceOrigin: 'native_governed',
  },
  'tNttnPKjdPg': {
    canonicalTitle: 'Yeh Ummat Hai? Ya Khwaab Ka Dhoka?',
    subtitle: 'The Forgotten Last Sermon',
    governanceOrigin: 'native_governed',
  },
  'LMen31sMjMg': {
    canonicalTitle: 'Kumar – Qalandar-e-Zaman',
    subtitle: 'Tribute to Caravan of Sufi Scientists',
    governanceOrigin: 'native_governed',
  },
  '_5a7HNedpUw': {
    canonicalTitle: 'Main Silsila-e-Owais Hoon',
    subtitle: 'A Soul-Call',
    governanceOrigin: 'native_governed',
  },
  'NfFq4qjiWDA': {
    canonicalTitle: 'Ya Rab Mujhe Rizq-e-Halaal De',
    subtitle: 'A Dua in the Spirit of Allama Iqbal',
    governanceOrigin: 'native_governed',
  },
  '3axIOaWesf0': {
    canonicalTitle: 'Teri Mitti… Mera Kashmir',
    subtitle: "Sufi Anthem for Kashmir's Soul",
    governanceOrigin: 'native_governed',
  },
  '3JmvkoRwM-0': {
    canonicalTitle: 'Mansoor! Jala! Mita! Bana! Saja!',
    subtitle: 'Ecstatic Remembrance',
    governanceOrigin: 'native_governed',
  },
  'hXAJUFwEuGk': {
    canonicalTitle: 'Sheikh Noorani (RA) – Alamdar-e-Kashmir',
    subtitle: 'Father of Sustainable Devotion',
    governanceOrigin: 'native_governed',
  },
  'cYAxRG1ESbo': {
    canonicalTitle: 'A Universal Sufi Call',
    subtitle: "Kashmir's Voice in Every Tongue",
    governanceOrigin: 'native_governed',
  },
  'n56tjt8uSjM': {
    canonicalTitle: 'La Ke Bina Kalima Jhooti Hai',
    subtitle: 'Tawheed & Annihilation',
    governanceOrigin: 'native_governed',
  },
  'jChUc58CZyw': {
    canonicalTitle: 'Main Habba Hoon',
    subtitle: 'Aaj Ki Habba Khatoon',
    governanceOrigin: 'native_governed',
  },
  'BMqHN5Uon_k': {
    canonicalTitle: 'Lalla – Noor Ki Maadar',
    subtitle: 'Kashmiri Mystic Heritage',
    governanceOrigin: 'native_governed',
  },
  'eEwA-LGF7uo': {
    canonicalTitle: 'Saaz Mein Bhi Tu Hi Hai',
    subtitle: 'Spiritual Music & Poetic Resistance',
    governanceOrigin: 'native_governed',
  },
  'najlQsUlBiw': {
    canonicalTitle: 'Yeh Dargah Mera Lahu Hai',
    subtitle: 'Amaanat Har Lafz Mein Jagaa',
    governanceOrigin: 'native_governed',
  },
  'i8cES7Ce_BU': {
    canonicalTitle: 'Baad Az Khuda Buzurg To Hai Qissa Mukhtasar',
    subtitle: 'Mid-Song Rebuttal',
    governanceOrigin: 'native_governed',
  },
  'iVBX2ODmOLM': {
    canonicalTitle: 'Sufi Ban',
    subtitle: 'Darood Ke Saath Farz Nibha',
    governanceOrigin: 'native_governed',
  },
  'eL00_rtDWrE': {
    canonicalTitle: 'Mera Walid Wali Tha',
    subtitle: 'Us Sabr Ka Sufi Hoon',
    governanceOrigin: 'native_governed',
  },
  'CsgGFTd8iLI': {
    canonicalTitle: 'Sajda Mohammad Ka Tha, Na Adam Ka',
    subtitle: 'Spiritual Realization',
    governanceOrigin: 'native_governed',
  },
  'a_MynvITxO4': {
    canonicalTitle: 'Pehla Sufi Mohammad ﷺ',
    subtitle: 'Noor-e-Muhammad Se Ibtidaa',
    governanceOrigin: 'native_governed',
  },
  'qodWD6igLEE': {
    canonicalTitle: 'Shikwa Jawab-e-Shikwa',
    subtitle: 'Sawaal Jawaab Bhi Tu',
    governanceOrigin: 'native_governed',
  },
  'OzqO23dy2GM': {
    canonicalTitle: 'Murshid Ke Qadmon Mein Noor Hai',
    subtitle: 'Main Murīd Hoon, Meri Rooh Nazar Mein Hai',
    governanceOrigin: 'native_governed',
  },
  'sDmCLoHeWeQ': {
    canonicalTitle: 'Main Iqbal Hoon, Main Sawal Hoon',
    subtitle: 'Philosophical Inward Inquiry',
    governanceOrigin: 'native_governed',
  },
  'Erl0JDrRbHw': {
    canonicalTitle: 'Manzil-e-Maqām – Labbaik Ya Rabb',
    subtitle: 'The Soul of a Traveler',
    governanceOrigin: 'native_governed',
  },
  'ChLkFuhUISA': {
    canonicalTitle: 'Har Daur Ka Karbala — Aur Tu?',
    subtitle: 'Every Era Has Its Karbala',
    governanceOrigin: 'native_governed',
  },
  '8rjuc2GBAns': {
    canonicalTitle: 'Main Bilāl Hoon',
    subtitle: 'Mera Ānsū Azān Ban Gayā',
    governanceOrigin: 'native_governed',
  },
  'gtT_l6AH7Rc': {
    canonicalTitle: 'Ya Ali, Ya Ali, Ya Ali',
    subtitle: 'When the Soul Calls Its Master',
    governanceOrigin: 'native_governed',
  },
  'NBZKTYqQDQA': {
    canonicalTitle: 'Main Hoon Sufi Tabeeb',
    subtitle: 'Healer of the Inner Spirit',
    governanceOrigin: 'native_governed',
  },
  'VKDBw6TiRC0': {
    canonicalTitle: 'Meri Khamoshi Teri Saza Banegi',
    subtitle: 'Silence as Witness',
    governanceOrigin: 'native_governed',
  },
  '3UwkaoS9xr4': {
    canonicalTitle: 'Woh Meri Kaaba Thi',
    subtitle: 'Spiritual Contemplation',
    governanceOrigin: 'native_governed',
  },
  'k9nznafeQ60': {
    canonicalTitle: 'Hu… Hu…',
    subtitle: 'Har Girah Ki Kunji',
    governanceOrigin: 'native_governed',
  },
  'uk22wyFlRFk': {
    canonicalTitle: 'Zameen Badli, Rooh Juda Nahin Hui',
    subtitle: 'Eternal Spiritual Bond',
    governanceOrigin: 'native_governed',
  },
  'cz9BhrPKoBc': {
    canonicalTitle: 'Shah-e-Hamdan Jaanta Hai Tu Kaun Hai',
    subtitle: 'Kashmiri Spiritual Lineage',
    governanceOrigin: 'native_governed',
  },
  'Qn0j9rNPAkI': {
    canonicalTitle: 'Jawān-o-Kashmir Se: Khitāb Qabl-e-Awliya',
    subtitle: 'Address to Kashmiri Youth',
    governanceOrigin: 'native_governed',
  },
  '8qyLuPGLx7w': {
    canonicalTitle: 'Sufi Cry for a River',
    subtitle: 'Environmental & Spiritual Lament',
    governanceOrigin: 'native_governed',
  },
  '_6pVqwZSQIE': {
    canonicalTitle: 'Shah-e-Hamdan: The Eternal Presence',
    subtitle: 'Sacred Heritage Return',
    governanceOrigin: 'native_governed',
  },
  'nFAGGKia4aU': {
    canonicalTitle: 'Mirror of Hazratbal, Wound of Dal',
    subtitle: 'Sacred Geography of Kashmir',
    governanceOrigin: 'native_governed',
  },
  'ZxgCJ1fXrKc': {
    canonicalTitle: "Needle's Hell to Noor's Bright Dawn",
    subtitle: 'From Darkness to Divine Radiance',
    governanceOrigin: 'native_governed',
  },
  'J0Vbn5XuVoc': {
    canonicalTitle: 'Allah in the Algorithm',
    subtitle: 'Sacred Presence in the Digital Age',
    governanceOrigin: 'native_governed',
  },
  'Aa-T-aA3kpk': {
    canonicalTitle: 'New Age Sufi on the Highway to Haqq',
    subtitle: 'Modern Spiritual Seeker',
    governanceOrigin: 'native_governed',
  },
  'EtehDd3oUVc': {
    canonicalTitle: 'Cry of the Kashmir Valley',
    subtitle: 'Come Light the Mystic Lamp',
    governanceOrigin: 'native_governed',
  },
  'U6uT9yaQy0Y': {
    canonicalTitle: 'Let Mansur Speak',
    subtitle: 'The Martyrdom of Divine Truth',
    governanceOrigin: 'native_governed',
  },
  'tFpnzwapo1A': {
    canonicalTitle: 'Sultan – The Spiritual King of Kashmir',
    subtitle: 'Sacred Saint History',
    governanceOrigin: 'native_governed',
  },
  'I1b9QtSmRAQ': {
    canonicalTitle: 'Dr. Kumar – Kashmir Calling Me',
    subtitle: 'The Calling of the Valley',
    governanceOrigin: 'native_governed',
  },
  'ZtI5T0H0nnY': {
    canonicalTitle: 'Seeker to Sufi – Divine Homecoming',
    subtitle: 'The Spiritual Transformation',
    governanceOrigin: 'native_governed',
  },
  'DiWJ_RBML08': {
    canonicalTitle: 'I Am a Sinner, Yet You Whisper Inside',
    subtitle: 'Divine Mercy and Repentance',
    governanceOrigin: 'native_governed',
  },
  'M4QhdhZPeTg': {
    canonicalTitle: 'O Shah-e-Hamadan – We Owe You All',
    subtitle: 'Our Roots, Our Way',
    governanceOrigin: 'native_governed',
  },
  '8yL--I2zeDE': {
    canonicalTitle: 'I Am Sufi, I Am You',
    subtitle: 'Universal Unity Anthem',
    governanceOrigin: 'native_governed',
  },
  'Sibgklh-W5g': {
    canonicalTitle: 'Dr. Gulam Mohamad Kumar – Sufi Legend of Kashmir',
    subtitle: 'Documentary Tribute',
    governanceOrigin: 'native_governed',
  },
  'a1wCTXlmlb4': {
    canonicalTitle: 'The Saints Still Walk',
    subtitle: 'Living Tradition of Kashmir',
    governanceOrigin: 'native_governed',
  },
  'D7hvqyQYJrk': {
    canonicalTitle: 'Kemis Taani Chhu Aav Aav',
    subtitle: 'Kashmiri-English Sufi Kalam',
    governanceOrigin: 'native_governed',
  },
  'UcV7rMQ7XGg': {
    canonicalTitle: 'Phir Likh Zarf-e-Noori',
    subtitle: 'Faith Does Not Fear Critics • Sufi Rebuttal',
    governanceOrigin: 'native_governed',
  },
  'LjmOxu1AVAg': {
    canonicalTitle: 'Raazdaar – Official Teaser II',
    subtitle: 'Cinematic Teaser',
    governanceOrigin: 'native_governed',
  },
  'q58mRXIsi-Y': {
    canonicalTitle: 'Lord of the Mysteries (خداوندانِ اسرار)',
    subtitle: 'Sacred Composition',
    governanceOrigin: 'native_governed',
  },
  'wMxWfsst48Q': {
    canonicalTitle: 'Raazdaar – Official Teaser I',
    subtitle: 'Cinematic Teaser',
    governanceOrigin: 'native_governed',
  },
  'kX2g8o2uEGw': {
    canonicalTitle: 'The Next Generation Sufi Way Forward',
    subtitle: 'Sufi Science Center Inaugural',
    governanceOrigin: 'native_governed',
  },
  '4HZbA2sfGmY': {
    canonicalTitle: 'Aahista Aahista Aahista',
    subtitle: 'Teach Your Soul How to Flow',
    governanceOrigin: 'native_governed',
  },
  'dXqkrpP-41I': {
    canonicalTitle: 'Pani Gawah Hai',
    subtitle: 'Kashmir: Water Bears Witness',
    governanceOrigin: 'native_governed',
  },
  '1kOiOhzXtUY': {
    canonicalTitle: 'Husain Andar - Yazeed Be',
    subtitle: 'Kise Doon Main Aasra',
    governanceOrigin: 'native_governed',
  },
  'ooxUUEsh5Kg': {
    canonicalTitle: 'Rehmat Se Likha Khwaab',
    subtitle: 'Na Meri Quwwat',
    governanceOrigin: 'native_governed',
  },
  'ffTfCn8N0hk': {
    canonicalTitle: 'Wanun Traav Hunar Haav',
    subtitle: 'Kashmiri Devotional Poetry',
    governanceOrigin: 'native_governed',
  },
  'RJeRdBuRto0': {
    canonicalTitle: 'Dr. Kumar Foundation USA Launch',
    subtitle: 'Institutional Global Announcement',
    governanceOrigin: 'native_governed',
  },
  '1iSM-HieULM': {
    canonicalTitle: 'Thori Si Toh Lift Kar De',
    subtitle: 'Prayer for Inner Upliftment',
    governanceOrigin: 'native_governed',
  }
};

function normalizeRelease(release) {
  const ytId = release.youtubeId || (release.id && release.id.startsWith('release_') ? release.id.split('_').pop() : release.id);
  const curated = CANONICAL_CATALOGUE[ytId] || CANONICAL_CATALOGUE[release.youtubeId] || CANONICAL_CATALOGUE[release.id];

  const rawTitle = release.youtubeStats?.title || release.youtubeTitle || release.title;
  const canonicalTitle = curated ? curated.canonicalTitle : (release.canonicalTitle || release.title);
  const subtitle = curated?.subtitle || release.subtitle || '';
  const governanceOrigin = curated?.governanceOrigin || (release.source === 'native' ? 'native_governed' : (release.governanceOrigin || 'native_governed'));
  const canonicalStatus = curated ? 'verified' : (release.canonicalStatus || 'verified');

  const youtubeTitle = rawTitle;
  const canonicalThumb = release.canonicalThumbnail || release.thumbnailUrl || '';
  const youtubeThumb = release.youtubeStats?.thumbnailUrl || release.youtubeThumbnailUrl || release.thumbnailUrl || '';

  const hasTitleDrift = Boolean(
    youtubeTitle && 
    canonicalTitle && 
    youtubeTitle.trim().toLowerCase() !== canonicalTitle.trim().toLowerCase()
  );

  return {
    ...release,
    title: canonicalTitle, // Canonical Release Title
    canonicalTitle: canonicalTitle,
    canonicalStatus: canonicalStatus,
    governanceOrigin: governanceOrigin,
    govType: governanceOrigin,
    subtitle: subtitle,
    youtubeTitle: youtubeTitle,
    canonicalThumbnail: canonicalThumb,
    youtubeThumbnailUrl: youtubeThumb,
    metadataStatus: hasTitleDrift ? 'drift_detected' : 'synced',
  };
}

function runMigration() {
  const dbPaths = [
    './.data/cms-releases.json',
    './lib/cms-seed-releases.json'
  ];

  for (const dbPath of dbPaths) {
    if (!fs.existsSync(dbPath)) continue;
    const raw = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(raw);

    const migrated = data.map(normalizeRelease);
    fs.writeFileSync(dbPath, JSON.stringify(migrated, null, 2), 'utf8');
    console.log(`✅ Migrated ${migrated.length} releases in ${dbPath}`);
  }

  // Update STATIC_YOUTUBE_VIDEOS in app/data/youtube-videos.ts
  const videosTsPath = './app/data/youtube-videos.ts';
  if (fs.existsSync(videosTsPath)) {
    const rawDb = JSON.parse(fs.readFileSync('./.data/cms-releases.json', 'utf8'));
    const staticVideos = rawDb.map(r => ({
      id: r.youtubeId || r.id,
      title: r.canonicalTitle || r.title,
      canonicalTitle: r.canonicalTitle || r.title,
      youtubeTitle: r.youtubeTitle || r.title,
      subtitle: r.subtitle || '',
      description: r.description || '',
      thumbnailUrl: r.thumbnailUrl || '',
      publishedDate: (r.publishedAt || r.releaseDate || '2026-01-01').slice(0, 10),
      durationSeconds: Number(r.durationSeconds || 0),
      durationFormatted: r.durationFormatted || '0:00',
      views: Number(r.viewCount || r.views || 0),
      source: r.source || 'native',
      governanceOrigin: r.governanceOrigin || 'native_governed',
      canonicalStatus: r.canonicalStatus || 'verified'
    }));

    const content = `/**
 * Static video registry — all published SufiPulse releases with Canonical Authority.
 * Generated from migrated cms-releases.json.
 */

export const STATIC_YOUTUBE_VIDEOS = ${JSON.stringify(staticVideos, null, 2)};
`;
    fs.writeFileSync(videosTsPath, content, 'utf8');
    console.log(`✅ Migrated static catalogue in ${videosTsPath}`);
  }
}

runMigration();
