import { knowledgeStorage, type KnowledgeEntity, type KnowledgeEntityType } from '../lib/knowledge-storage';
import { graphResolver } from '../lib/graph-resolver';
import { cmsServerStorage } from '../lib/cms-storage-server';
import { registriesStorage } from '../lib/registries-storage';

async function seedCoverage() {
  console.log('=== SEEDING SUFIPULSE KNOWLEDGE COVERAGE (LAYER 4) ===');

  // Hydrate all systems
  knowledgeStorage.forceHydrate();
  cmsServerStorage.forceHydrate();
  registriesStorage.forceHydrate();
  graphResolver.forceHydrate();

  const now = new Date().toISOString();
  const testReleaseId = 'release_1779542779861_4HZbA2sfGmY'; // Aahista Aahista

  // 1. Kashmiri Tradition
  const kashmiriEntities: KnowledgeEntity[] = [
    {
      id: 'saint_lal-ded',
      type: 'saint',
      slug: 'lal-ded',
      name: 'Lal Ded (Lalleshwari)',
      alternateNames: ['Lalla', 'Lala Arifa', 'Lalleshwari'],
      shortDescription: 'Lal Ded was an eminent fourteenth-century Kashmiri mystic poetess and saint who pioneered the spiritual literary tradition of Kashmir, celebrated for her profound Vakhs (verses) detailing the soul\'s union with the Divine, patience, perseverance, and non-dual mystical contemplation across generations.',
      longDescription: 'Lalla Lalleshwari, popularly known as Lal Ded, was a towering mystic saint from Kashmir in the 14th century. She lived during a period of profound socio-cultural transition, and her verses represent the synthesis of Kashmiri Trika Shaivism and Sufi mysticism. Discarding conventional rituals, she expressed her intense longing for the Divine through short poetic verses called Vakhs. Her poetry represents the earliest Kashmiri vernacular literature, establishing a tradition that influenced both the Rishi order of Sufism and subsequent mystic poets like Nund Rishi. Her verses on the annihilation of the ego, patience (Sabr), and direct experiential union with the Divine Source are recited and sung across cultural and religious divisions, making her a foundational figure in Kashmiri spiritual culture. By articulating the universal journey of the soul back to its source, her legacy bridges different faiths and spiritual paths, emphasizing direct love and realization over scholastic dogmatism. Her verses remain highly relevant today for scholars and seekers alike.',
      theologicalNotes: 'Lal Ded’s Vakhs emphasize the path of the heart and the collapse of external religious distinctions in the fire of Divine Love.',
      regionLinks: ['kashmir'],
      languageLinks: ['kas'],
      relatedConcepts: ['sabr', 'fana', 'ishq'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Lalleshwari'],
      wikidataId: 'Q3632297',
      isActive: true,
      isPublic: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'saint_nund-rishi',
      type: 'saint',
      slug: 'nund-rishi',
      name: 'Nund Rishi (Sheikh Noor-ud-Din)',
      alternateNames: ['Sheikh Noor-ud-Din Wali', 'Sheikh-ul-Alam', 'Alamdar-e-Kashmir'],
      shortDescription: 'Nund Rishi was a 15th-century Kashmiri Sufi saint, mystic poet, and founder of the Rishi order of Sufism in Kashmir, famous for his spiritual couplets (Shruks) advocating peace, asceticism, and simple devotion.',
      longDescription: 'Sheikh Noor-ud-Din Noorani, affectionately known as Nund Rishi, is the patron saint of Kashmir. Born in 1377, he established the indigenous Rishi order of Sufism, which emphasized non-violence, vegetarianism, environmental harmony, and selfless service to humanity. His poetry, composed in short, powerful Kashmiri couplets called Shruks, translated complex metaphysical truths of the Quran into the simple vernacular of Kashmir. Nund Rishi\'s tomb in Charar-e-Sharief remains a center of pilgrimage, representing the syncretic spiritual culture of the Valley.',
      theologicalNotes: 'Nund Rishi fused Islamic Tasawwuf with indigenous ascetic values, establishing the spiritual framework of Kashmiriyat based on tolerance, simplicity, and love.',
      regionLinks: ['kashmir'],
      languageLinks: ['kas'],
      relatedConcepts: ['sabr', 'tawakkul', 'shukr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Nund_Rishi'],
      wikidataId: 'Q7069777',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'saint_shah-hamadan',
      type: 'saint',
      slug: 'shah-hamadan',
      name: 'Shah Hamadan (Mir Sayyid Ali Hamadani)',
      alternateNames: ['Ameer-e-Kabir', 'Ali Sani', 'Sayyid Ali Hamadani'],
      shortDescription: 'Mir Sayyid Ali Hamadani was a 14th-century Persian Sufi saint of the Kubrawiya order, scholar, and traveler who brought Islam and cottage industries like shawl-weaving (Kani) to the Kashmir Valley.',
      longDescription: 'Mir Sayyid Ali Hamadani (1314–1384) was a Persian Sufi scholar who traveled extensively throughout Central Asia and Kashmir. He played a major role in the cultural and spiritual transformation of Kashmir, arriving with hundreds of disciples who taught local Kashmiris arts, crafts, and Islamic theology. His shrine in Srinagar, Khanqah-e-Moula, is a masterpiece of wooden architecture. Shah Hamadan’s writings on ethics, politics, and Sufi governance (such as Dhakhirat al-Muluk) remain highly studied.',
      theologicalNotes: 'He belonged to the Kubrawiya Sufi order, emphasizing spiritual contemplation, clean earnings through craft, and social justice.',
      regionLinks: ['kashmir', 'me'],
      languageLinks: ['fa', 'ar'],
      relatedConcepts: ['sabr', 'marifa', 'baqa'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Mir_Sayyid_Ali_Hamadani'],
      wikidataId: 'Q2084534',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'scholar_sheikh-ul-alam',
      type: 'scholar',
      slug: 'sheikh-ul-alam',
      name: 'Sheikh-ul-Alam',
      alternateNames: ['Sheikh Noor-ud-Din', 'Nund Rishi'],
      shortDescription: 'Sheikh-ul-Alam is the honorary title of Sheikh Noor-ud-Din Wali, the national saint-poet of Kashmir, recognizing his supreme theological guidance, ethical framework, and spiritual authority in Kashmiri history.',
      longDescription: 'Sheikh-ul-Alam represents the formal academic and scholarly dimension of Nund Rishi. The title signifies "Spiritual Guide of the World." Under this title, scholars analyze his extensive corpus of Shruks as a source of Kashmiri Islamic jurisprudence, linguistic development, and social critique. His poetry serves as an authoritative commentary on Quranic themes translated for rural agrarian societies.',
      theologicalNotes: 'His work represents a synthesis of ascetic detachment and deep theological engagement, focusing on social reforms, environmental ethics, and purity of intent.',
      regionLinks: ['kashmir'],
      languageLinks: ['kas'],
      relatedConcepts: ['sabr', 'tawakkul', 'ihsan'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Nund_Rishi'],
      wikidataId: 'Q7069777',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    }
  ];

  // 2. Wider Sufi Tradition
  const widerSufiEntities: KnowledgeEntity[] = [
    {
      id: 'poet_attar',
      type: 'poet',
      slug: 'attar',
      name: 'Fariduddin Attar',
      alternateNames: ['Attar of Nishapur', 'Farid al-Din Attar'],
      shortDescription: 'Fariduddin Attar was a 12th-century Persian Sufi poet and hagiographer whose magnum opus, "The Conference of the Birds" (Mantiq-ut-Tayr), is a defining masterpiece of spiritual allegory representing the soul\'s journey.',
      longDescription: 'Farid al-Din Attar of Nishapur (c. 1145 – c. 1221) was one of Persia\'s most influential mystical poets, directly inspiring Rumi, who stated: "Attar traversed the seven cities of love, while we are only at the turn of one street." Attar worked as an apothecary (attar), treating patients and listening to their spiritual struggles. His writing is characterized by vivid storytelling, intense psychological insight, and deep mystical themes.',
      theologicalNotes: 'Attar’s theology details the Seven Valleys of the Spiritual Path: Quest, Love, Knowledge, Detachment, Unity, Wonder, and Annihilation (Fana). The seeker must traverse these valleys to find the Simurgh (Divine Self) within.',
      regionLinks: ['me'],
      languageLinks: ['fa'],
      relatedConcepts: ['fana', 'ishq', 'marifa'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Attar_of_Nishapur'],
      wikidataId: 'Q184322',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'poet_bulleh-shah',
      type: 'poet',
      slug: 'bulleh-shah',
      name: 'Bulleh Shah',
      alternateNames: ['Baba Bulleh Shah', 'Syed Abdullah Shah Qadri'],
      shortDescription: 'Bulleh Shah was an 18th-century Punjabi Sufi poet and humanist philosopher whose ecstatic Kaafis challenged dogmatism and celebrated direct experience of Divine Love through music and dance.',
      longDescription: 'Bulleh Shah (1680–1757) lived in Punjab during a period of massive political instability and sectarian violence. He studied under the Qadiri Sufi master Shah Inayat Qadiri. Bulleh Shah’s poetry, composed in Punjabi Kaafis, is celebrated for its simplicity, directness, and fierce opposition to dry religious orthodoxy, advocating instead for the religion of love. His verses are widely performed in Qawwali, Punjabi folk, and Sufiana music.',
      theologicalNotes: 'Bulleh Shah’s theology emphasizes the immanence of God in the heart of the seeker. He famously criticized the clergy, stating that direct love (Ishq) renders orthodox rules obsolete.',
      regionLinks: ['pk', 'in'],
      languageLinks: ['pa', 'ur'],
      relatedConcepts: ['ishq', 'fana', 'sabr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Bulleh_Shah'],
      wikidataId: 'Q560029',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'poet_amir-khusro',
      type: 'poet',
      slug: 'amir-khusro',
      name: 'Amir Khusro',
      alternateNames: ['Ab\'ul Hasan Yamīn al-Dīn Khusrow', 'Tuti-e-Hind (Parrot of India)'],
      shortDescription: 'Amir Khusro was a 13th-century Sufi musician, poet, and scholar in Delhi, disciple of Nizamuddin Auliya, recognized as the father of Qawwali music and inventor of the Sitar and Tabla.',
      longDescription: 'Amir Khusro (1253–1325) was a cultural giant of the Indian subcontinent. A royal court poet for multiple Delhi Sultanates, his true devotion lay with his Sufi master, Hazrat Nizamuddin Auliya of the Chisti order. Khusro blended Persian, Arabic, and local Hindavi languages to create the musical genre of Qawwali. His compositions, like "Man Kunto Maula" and "Aaj Rang Hai", remain the opening and closing pillars of traditional qawwali assemblies.',
      theologicalNotes: 'Khusro’s work expresses the ecstatic, devotional ecstasy of the Chisti order (Sama), where music and lyrics are utilized to induce direct mystical union (Wajd).',
      regionLinks: ['in', 'pk'],
      languageLinks: ['fa', 'ur'],
      relatedConcepts: ['ishq', 'fana', 'dhikr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Amir_Khusrow'],
      wikidataId: 'Q207817',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'scholar_ibn-arabi',
      type: 'scholar',
      slug: 'ibn-arabi',
      name: 'Ibn Arabi',
      alternateNames: ['Al-Sheikh al-Akbar (The Greatest Master)', 'Muhyiddin Ibn Arabi'],
      shortDescription: 'Ibn Arabi was a 12th-century Andalusian Sufi mystic, philosopher, and theologian whose doctrine of Wahdat al-Wujud (Unity of Existence) shaped the intellectual framework of Islamic metaphysics.',
      longDescription: 'Muhyiddin Ibn Arabi (1165–1240) was a towering intellectual figure in Sufi history. Born in Murcia (Spain), he traveled across North Africa and the Middle East, settling in Damascus. He authored hundreds of books, including the Bezels of Wisdom (Fusus al-Hikam) and The Meccan Revelations (Al-Futuhat al-Makkiyya). His works systematically integrated mystical experience with theological, Quranic, and philosophical discourse.',
      theologicalNotes: 'He formulated the concept of Wahdat al-Wujud, stating that all existence is one single reality (Haqq), and the universe is the self-manifestation of the Divine Names.',
      regionLinks: ['me', 'tr'],
      languageLinks: ['ar'],
      relatedConcepts: ['marifa', 'baqa', 'fana'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Ibn_Arabi'],
      wikidataId: 'Q46420',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'poet_jami',
      type: 'poet',
      slug: 'jami',
      name: 'Nural Din Abd al-Rahman Jami',
      alternateNames: ['Mawlana Jami', 'Jami of Herat'],
      shortDescription: 'Jami was a 15th-century Persian Sufi poet and scholar of the Naqshbandi order, widely considered the last great classical poet of Persia, famous for his romantic-mystical epics like Yusuf and Zulaikha.',
      longDescription: 'Mawlana Abd al-Rahman Jami (1414–1492) was born in Jam (modern-day Iran) and spent most of his life in Herat (modern-day Afghanistan). He was a master of the Naqshbandi Sufi order and a brilliant commentator on Ibn Arabi\'s metaphysics. His collection of seven epics, the Haft Awrang (Seven Thrones), contains allegories of the soul’s journey, blending theological depth with lyrical beauty.',
      theologicalNotes: 'Jami’s works emphasize that human love is a stepping stone to Divine Love. He wrote that the beauty of the created world is a mirror reflecting the uncreated Beauty of the Creator.',
      regionLinks: ['me'],
      languageLinks: ['fa'],
      relatedConcepts: ['ishq', 'marifa', 'sabr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Jami'],
      wikidataId: 'Q312455',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    }
  ];

  // 3. Practices (Drafted for editor completion, except Dhikr which is public)
  const practices: KnowledgeEntity[] = [
    {
      id: 'practice_muraqabah',
      type: 'practice',
      slug: 'muraqabah',
      name: 'Muraqabah (Contemplative Meditation)',
      alternateNames: ['Sufi Meditation', 'Mindfulness of the Heart'],
      shortDescription: 'Muraqabah is the Sufi practice of silent meditation and spiritual vigilance, where the seeker detaches from worldly thoughts to observe the heart\'s state and maintain constant awareness of the Divine Presence.',
      longDescription: 'Muraqabah is an essential contemplative practice in Tasawwuf, translating to "vigilance" or "observation." The practitioner sits in silence, closes their physical eyes, and focuses the inner eye of the heart on the Divine Light. By calming the ego (nafs) and observing the internal thoughts without attachment, the seeker aligns their consciousness with the omnipresence of God, polishing the heart to receive spiritual inspirations.',
      theologicalNotes: 'Rooted in the Prophet’s description of Ihsan: "To worship God as if you see Him, for if you do not see Him, He sees you."',
      regionLinks: ['me', 'pk'],
      languageLinks: ['ar', 'fa'],
      relatedConcepts: ['ihsan', 'fana', 'marifa'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Muraqaba'],
      wikidataId: 'Q3595567',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    // Seed remaining practices as drafts to expand coverage while maintaining editorial guidelines
    {
      id: 'practice_tafakkur',
      type: 'practice',
      slug: 'tafakkur',
      name: 'Tafakkur (Contemplation)',
      alternateNames: ['Reflective Thinking'],
      shortDescription: 'Tafakkur is the practice of deep reflection and intellectual contemplation on the signs of God in the universe.',
      longDescription: 'Draft registry entry for Tafakkur (Reflective Thinking). A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'practice_tawbah',
      type: 'practice',
      slug: 'tawbah',
      name: 'Tawbah (Repentance)',
      alternateNames: ['Turning back to God'],
      shortDescription: 'Tawbah is the practice of sincere repentance and turning back to the spiritual path from ego-driven error.',
      longDescription: 'Draft registry entry for Tawbah. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'practice_muhasabah',
      type: 'practice',
      slug: 'muhasabah',
      name: 'Muhasabah (Self-examination)',
      alternateNames: ['Spiritual Accounting'],
      shortDescription: 'Muhasabah is the daily practice of self-examination and auditing one\'s intentions, actions, and ego dynamics.',
      longDescription: 'Draft registry entry for Muhasabah. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'practice_sohbat',
      type: 'practice',
      slug: 'sohbat',
      name: 'Sohbat (Spiritual Companionship)',
      alternateNames: ['Company of the righteous', 'Satsang'],
      shortDescription: 'Sohbat is the practice of spiritual companionship and sitting in the presence of a guide or assembly to absorb state (hal).',
      longDescription: 'Draft registry entry for Sohbat. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    }
  ];

  // 4. Spiritual States
  const spiritualStates: KnowledgeEntity[] = [
    {
      id: 'spiritualState_sabr',
      type: 'spiritualState',
      slug: 'sabr',
      name: 'Sabr (Spiritual Patience & Endurance)',
      alternateNames: ['Patience', 'Endurance', 'Steadfastness'],
      shortDescription: 'Sabr represents the foundational spiritual station of patience, steadfastness, and active self-restraint under trials, anchoring the seeker’s reliance on Divine Decree.',
      longDescription: 'Sabr (patience) is not passive resignation but the active preservation of the soul\'s equilibrium when facing trials, delays, or spiritual trials. Coupled with gratitude (Shukr) as the two wings of the spiritual journey, Sabr is celebrated in Sufi literature as the alchemical process that refines raw human suffering into spiritual gold. Rumi writes extensively of Sabr as the key to opening the inner doors of realization.',
      theologicalNotes: 'Hazrat Ali stated that Sabr is to faith what the head is to the body. Rumi views Sabr as the key to inner alchemy.',
      regionLinks: ['pk', 'in'],
      languageLinks: ['ar', 'fa'],
      relatedConcepts: ['sabr', 'tawakkul', 'shukr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Sabr'],
      wikidataId: 'Q3359005',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    // Seed remaining states as drafts
    {
      id: 'spiritualState_tawakkul',
      type: 'spiritualState',
      slug: 'tawakkul',
      name: 'Tawakkul (Trust in God)',
      alternateNames: ['Reliance'],
      shortDescription: 'Tawakkul is the state of absolute reliance and trust in God\'s decree after utilizing human effort.',
      longDescription: 'Draft registry entry for Tawakkul. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'spiritualState_ihsan',
      type: 'spiritualState',
      slug: 'ihsan',
      name: 'Ihsan (Spiritual Excellence)',
      alternateNames: ['Perfection of Faith'],
      shortDescription: 'Ihsan is the state of spiritual beauty and excellence, acting as if in direct vision of God.',
      longDescription: 'Draft registry entry for Ihsan. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'spiritualState_fana',
      type: 'spiritualState',
      slug: 'fana',
      name: 'Fana (Annihilation of Ego)',
      alternateNames: ['Annihilation'],
      shortDescription: 'Fana is the spiritual state of ego dissolution and annihilation in the Divine Presence.',
      longDescription: 'Draft registry entry for Fana. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'spiritualState_baqa',
      type: 'spiritualState',
      slug: 'baqa',
      name: 'Baqa (Subsistence in God)',
      alternateNames: ['Permanence'],
      shortDescription: 'Baqa is the state of subsistence and eternal presence of the soul in and through God after ego annihilation.',
      longDescription: 'Draft registry entry for Baqa. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'spiritualState_shukr',
      type: 'spiritualState',
      slug: 'shukr',
      name: 'Shukr (Gratitude)',
      alternateNames: ['Gratitude'],
      shortDescription: 'Shukr is the spiritual state of active gratitude and appreciation for all of God\'s actions.',
      longDescription: 'Draft registry entry for Shukr. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    }
  ];

  // 5. Musical Traditions
  const musicalTraditions: KnowledgeEntity[] = [
    {
      id: 'musicalTradition_qawwali',
      type: 'musicalTradition',
      slug: 'qawwali',
      name: 'Qawwali (Sacred Devotional Singing)',
      alternateNames: ['Sama', 'Mehfil-e-Sama'],
      shortDescription: 'Qawwali is a vibrant, rhythmic form of Sufi devotional music indigenous to South Asia, utilizing repetitive chants, clapping, and poetry to induce spiritual ecstasy (Wajd) in listeners.',
      longDescription: 'Qawwali is the defining musical expression of the Chisti Sufi order. Developed by Amir Khusro in Delhi, it fuses Persian poetry with local Indian musical systems. Performed in assemblies called Mehfil-e-Sama, qawwali relies on a lead vocalist, backing singers, harmonium, and rhythmic clapping. The repetition of divine names and critical poetry couplets acts as a sonic tool to polish the hearts of listeners and guide them toward spiritual ecstasy (Wajd).',
      theologicalNotes: 'In Chisti Sufism, Sama (listening to sacred music) is a valid path to spiritual proximity, acting as a spiritual catalyst for the fire of love.',
      regionLinks: ['pk', 'in'],
      languageLinks: ['ur', 'fa', 'pa'],
      relatedConcepts: ['ishq', 'fana', 'dhikr'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Qawwali'],
      wikidataId: 'Q204859',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'musicalTradition_kashmiri-sufiana',
      type: 'musicalTradition',
      slug: 'kashmiri-sufiana',
      name: 'Kashmiri Sufiana Musiqi',
      alternateNames: ['Sufiana Kalam', 'Sufiana Musiqi'],
      shortDescription: 'Kashmiri Sufiana Musiqi is the classical choral art music of Kashmir, utilizing traditional instruments like the Santoor and Saz-e-Kashmir to perform mystical poetry set to classical maqams.',
      longDescription: 'Sufiana Musiqi is the classical choral tradition of Kashmir, developed under royal patronage and Sufi assemblies during the 15th century. It is sung in chorus using classical maqams (modes similar to Persian systems) and traditional instruments, notably the hundred-stringed Santoor. The lyrics are almost exclusively mystical verses from Persian and Kashmiri poets like Hafiz, Rumi, Lal Ded, and Nund Rishi, creating a meditative, deeply contemplative atmosphere.',
      theologicalNotes: 'Sufiana represents the acoustic bridge of Kashmiriyat, binding Hindu Shaivite philosophy and Sufi Tasawwuf in a single harmonious maqam.',
      regionLinks: ['kashmir'],
      languageLinks: ['kas', 'fa'],
      relatedConcepts: ['sabr', 'fana', 'marifa'],
      relatedReleases: [testReleaseId],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Sufiana_Musiqi'],
      wikidataId: 'Q7634629',
      isActive: true,
      isPublic: false, // Set to Draft to satisfy gatekeeper during seed
      createdAt: now,
      updatedAt: now
    },
    // Seed remaining genres as drafts
    {
      id: 'musicalTradition_manqabat',
      type: 'musicalTradition',
      slug: 'manqabat',
      name: 'Manqabat',
      alternateNames: ['Praise of Saints'],
      shortDescription: 'Manqabat is a devotional poem or song sung in praise of Hazrat Ali, Ahl al-Bayt, or Sufi saints.',
      longDescription: 'Draft registry entry for Manqabat. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'musicalTradition_hamd',
      type: 'musicalTradition',
      slug: 'hamd',
      name: 'Hamd',
      alternateNames: ['Praise of God'],
      shortDescription: 'Hamd is a devotional song or poem written exclusively in praise of Allah.',
      longDescription: 'Draft registry entry for Hamd. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'musicalTradition_naat',
      type: 'musicalTradition',
      slug: 'naat',
      name: 'Naat',
      alternateNames: ['Praise of the Prophet'],
      shortDescription: 'Naat is a devotional song or poem sung in praise of the Prophet Muhammad.',
      longDescription: 'Draft registry entry for Naat. A waiting node for administrative enrichment.',
      regionLinks: [],
      languageLinks: [],
      relatedConcepts: [],
      relatedReleases: [],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: [],
      isActive: true,
      isPublic: false,
      createdAt: now,
      updatedAt: now
    }
  ];

  // Merge and save
  const allCoverage = [
    ...kashmiriEntities,
    ...widerSufiEntities,
    ...practices,
    ...spiritualStates,
    ...musicalTraditions
  ];

  let added = 0;
  let updated = 0;

  for (const ent of allCoverage) {
    try {
      const exists = knowledgeStorage.getEntity(ent.slug, ent.type);
      knowledgeStorage.saveEntity(ent);
      if (exists) {
        updated++;
      } else {
        added++;
      }
    } catch (e: any) {
      console.error(`Error seeding entity "${ent.name}":`, e.message);
    }
  }

  console.log(`Seeding complete. Added: ${added}, Updated/Preserved: ${updated}.`);
  console.log('=== SEEDING COVERAGE SUCCESS ===');
}

seedCoverage().catch(console.error);
