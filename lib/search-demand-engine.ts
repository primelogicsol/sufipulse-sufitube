/**
 * lib/search-demand-engine.ts
 *
 * AI-Assisted Multilingual Search Demand & Existing-Release Mapping Engine (Phase 4).
 *
 * GOVERNANCE & DATA INTEGRITY INVARIANTS:
 * 1. NEVER invents monthly search volumes, keyword difficulty scores, or synthetic traffic projections.
 * 2. Covers all 4 target scripts/languages: English, Roman Urdu, Urdu Nastaliq (اردو), and Devanagari (देवनागरी).
 * 3. Preserves authentic Sufi, Kashmiri, Urdu, and devotional terminology.
 * 4. Always matches demand clusters to EXISTING published full-length SufiPulse songs FIRST,
 *    identifying metadata, 4-script lyric/subtitle, and Discovery Graph optimization opportunities
 *    before flagging genuine catalog gaps.
 */

import { cmsServerStorage } from './cms-storage-server';
import { graphResolver } from './graph-resolver';
import { getYouTubeStudioSnapshot } from './youtube-studio-import';
import { resolveCanonicalSongTitle } from './canonical-seo';
import type { YouTubeDiscoverySnapshot } from './youtube-discovery-intelligence';
import type { GscSearchAnalyticsReport } from './google-search-console';

export interface MultilingualQuerySet {
  english: string[];
  romanUrdu: string[];
  urduNastaliq: string[];
  devanagari: string[];
}

export interface ReleaseScriptCoverage {
  english: boolean;
  romanUrdu: boolean;
  urduNastaliq: boolean;
  devanagari: boolean;
  coveredCount: number; // 0..4 approved public scripts
  draftPreparedCount?: number; // 0..4 scripts staged in draft/under_review behind Human Approval Gate
  sourceRecoveryRequired?: boolean; // true when no authoritative lyric source exists in any script
}

export interface MatchedClusterRelease {
  id: string;
  slug: string;
  canonicalTitle: string;
  youtubeId: string | null;
  matchReasons: string[];
  totalViews: number;
  studioImpressions: number | null;
  studioCtr: number | null;
  graphConnectionsCount: number;
  scriptCoverage: ReleaseScriptCoverage;
  optimizationGap: string | null;
}

export interface SearchDemandClusterReport {
  clusterId: string;
  title: string;
  domain: string;
  intentSummary: string;
  targetTaxonomy: {
    concepts: string[];
    themes: string[];
    moods: string[];
    regions: string[];
  };
  multilingualQueries: MultilingualQuerySet;
  measuredSignals: {
    youtubeSearchViews28d: number;
    youtubeSearchViewsLifetime: number;
    matchedYoutubeQueries: string[];
    gscClicks28d: number | null; // null when GSC NOT_CONFIGURED
    gscImpressions28d: number | null;
    signalProvenance: string;
  };
  existingCatalogCoverage: {
    matchedReleasesCount: number;
    totalCatalogViewsInCluster: number;
    fourScriptReadyCount: number;
    graphConnectedCount: number;
    status: 'STRONG_CATALOG_MATCH' | 'METADATA_OPTIMIZATION_NEEDED' | 'CATALOG_EXPANSION_CANDIDATE';
  };
  matchedReleases: MatchedClusterRelease[];
  recommendedAction: string;
}

interface ClusterDefinition {
  clusterId: string;
  title: string;
  domain: string;
  intentSummary: string;
  lexicalTokens: string[];
  targetTaxonomy: {
    concepts: string[];
    themes: string[];
    moods: string[];
    regions: string[];
  };
  multilingualQueries: MultilingualQuerySet;
}

export const SUFI_SEARCH_DEMAND_CLUSTERS: ClusterDefinition[] = [
  {
    clusterId: 'sufi-music-contemporary',
    title: 'Sufi Music & Sacred Devotional Song',
    domain: 'Core Sufi Music',
    intentSummary: 'Listeners searching globally for full-length Sufi songs, soulful spiritual music, and contemporary sacred compositions.',
    lexicalTokens: ['sufi', 'sacred', 'mystic', 'soulful', 'devotional', 'divine', 'spiritual song'],
    targetTaxonomy: {
      concepts: ['tasawwuf', 'ishq'],
      themes: ['divine_love', 'spiritual_journey'],
      moods: ['contemplative', 'ecstatic'],
      regions: ['in', 'pk', 'bd', 'us', 'uk'],
    },
    multilingualQueries: {
      english: ['sufi music full song', 'contemporary sufi devotional music', 'sacred sufi songs with english lyrics'],
      romanUrdu: ['sufi kalam full video', 'ruhafza sufi mausiqi', 'dil ko sukoon dene wala sufi kalam'],
      urduNastaliq: ['صوفی موسیقی مکمل کلام', 'روحانی صوفی گیت', 'جدید صوفی کلام مع ترجمہ'],
      devanagari: ['सूफी संगीत पूरा गाना', 'रूहानी सूफी कलाम', 'सूफी भक्ति संगीत'],
    },
  },
  {
    clusterId: 'kashmiri-sufi-kalam',
    title: 'Kashmiri Sufi Songs & Sufiana Mausiqi',
    domain: 'Kashmiri Sufi Songs',
    intentSummary: 'Audiences seeking authentic Kashmiri Sufi kalam, Sufiana Mausiqi, santoor/rabab textures, and Valley spiritual songs.',
    lexicalTokens: ['kashmir', 'kashmiri', 'sufiana', 'valley', 'chinar', 'vitasta', 'jhelum', 'artisan'],
    targetTaxonomy: {
      concepts: ['ishq', 'marifa', 'faqr'],
      themes: ['spiritual_journey', 'seeking_union'],
      moods: ['longing', 'contemplative'],
      regions: ['in', 'pk', 'uk', 'us'],
    },
    multilingualQueries: {
      english: ['kashmiri sufi songs', 'sufiana mausiqi kashmir', 'kashmiri mystic poetry music'],
      romanUrdu: ['kashmiri sufi kalam', 'kashmir sufiana kalam', 'kashmiri roohani geet'],
      urduNastaliq: ['کشمیری صوفی کلام', 'کشمیری صوفیانہ موسیقی', 'وادی کشمیر کا عارفانہ کلام'],
      devanagari: ['कश्मीरी सूफी गीत', 'कश्मीरी सूफियाना कलाम', 'कश्मीर का रूहानी संगीत'],
    },
  },
  {
    clusterId: 'urdu-sufi-kalam',
    title: 'Urdu Sufi Kalam & Arfana Kalaam',
    domain: 'Urdu Sufi Kalam',
    intentSummary: 'High-intent South Asian and diaspora listeners searching for original Urdu arfana kalam with synchronized lyrics.',
    lexicalTokens: ['urdu', 'kalam', 'arfana', 'ishq', 'dil', 'rooh', 'maula', 'khuda', 'rab', 'safar'],
    targetTaxonomy: {
      concepts: ['ishq', 'tasawwuf', 'haqiqa'],
      themes: ['divine_love', 'seeking_union'],
      moods: ['reflective', 'longing'],
      regions: ['in', 'pk', 'bd', 'me', 'us', 'uk'],
    },
    multilingualQueries: {
      english: ['urdu sufi kalam with translation', 'original arfana kalam urdu', 'deep urdu sufi song lyrics'],
      romanUrdu: ['urdu arfana kalam', 'sufi kalam urdu lyrics', 'ishq e haqiqi urdu kalam'],
      urduNastaliq: ['اردو عارفانہ کلام', 'اردو صوفی کلام مع تشریح', 'دل کو چھو لینے والا صوفی کلام'],
      devanagari: ['उर्दू सूफी कलाम लिरिक्स', 'आरिफाना कलाम हिंदी अर्थ सहित', 'रूहानी उर्दू कलाम'],
    },
  },
  {
    clusterId: 'sufi-mystical-poetry',
    title: 'Sufi Mystical Poetry, Ghazal & Kafi',
    domain: 'Sufi Mystical Poetry',
    intentSummary: 'Readers and listeners searching poetic couplets, ghazals, kafis, and lyrical interpretations of Divine longing.',
    lexicalTokens: ['poetry', 'poem', 'ghazal', 'kafi', 'shayari', 'couplet', 'verse', 'mystical', 'noori'],
    targetTaxonomy: {
      concepts: ['ishq', 'marifa'],
      themes: ['divine_love', 'seeking_union'],
      moods: ['longing', 'melancholic', 'reflective'],
      regions: ['in', 'pk', 'bd', 'uk', 'us', 'ca'],
    },
    multilingualQueries: {
      english: ['sufi mystical poetry sung', 'spiritual urdu ghazal full song', 'sufi kafi music'],
      romanUrdu: ['sufiana shayari kalam', 'tasawwuf ki ghazal', 'roohani urdu shayari'],
      urduNastaliq: ['صوفیانہ شاعری اور غزل', 'تصوف کے اشعار مع موسیقی', 'عارفانہ کافی اور غزل'],
      devanagari: ['सूफियाना शायरी और ग़ज़ल', 'तसव्वुफ़ की कविताएं', 'सूफी काफ़ी संगीत'],
    },
  },
  {
    clusterId: 'spiritual-contemplation-sabr-tawakkul',
    title: 'Spiritual Music for Inner Peace, Sabr & Tawakkul',
    domain: 'Spiritual & Contemplative Music',
    intentSummary: 'Listeners seeking solace, patience (Sabr), trust in God (Tawakkul), repentance (Tawbah), and meditative reflection.',
    lexicalTokens: ['peace', 'silence', 'khamosh', 'sabr', 'patience', 'tawakkul', 'trust', 'hope', 'healing', 'sukoon', 'prayer', 'dua'],
    targetTaxonomy: {
      concepts: ['sabr', 'tawakkul', 'rida', 'shukr'],
      themes: ['repentance_tawbah', 'spiritual_journey'],
      moods: ['serene', 'contemplative', 'reflective'],
      regions: ['us', 'uk', 'ca', 'in', 'pk', 'bd', 'my', 'id'],
    },
    multilingualQueries: {
      english: ['spiritual music for inner peace', 'songs about sabr and tawakkul', 'contemplative islamic spiritual music'],
      romanUrdu: ['sabr aur tawakkul kalam', 'qalbi sukoon ka roohani kalam', 'dua aur munajat kalam'],
      urduNastaliq: ['صبر اور توکل پر کلام', 'قلبی سکون کی روحانی موسیقی', 'مناجات اور دعا کلام'],
      devanagari: ['सब्र और तवक्कुल कलाम', 'दिल के सुकून का रूहानी संगीत', 'दुआ और मुनाजात'],
    },
  },
  {
    clusterId: 'zikr-dhikr-sama',
    title: 'Sacred Remembrance: Zikr (Dhikr), Allah Hoo & Sama',
    domain: 'Sacred Remembrance',
    intentSummary: 'Listeners searching for meditative Zikr/Dhikr chants, Allah Hoo, and Chishti/Qadiri Sama spiritual listening.',
    lexicalTokens: ['zikr', 'dhikr', 'allah hoo', 'allah hu', 'sama', 'remembrance', 'chant', 'wajd', 'hu'],
    targetTaxonomy: {
      concepts: ['dhikr', 'fana', 'tasawwuf'],
      themes: ['praise_hamd', 'seeking_union'],
      moods: ['ecstatic', 'serene'],
      regions: ['pk', 'in', 'bd', 'tr', 'id', 'my', 'me'],
    },
    multilingualQueries: {
      english: ['sufi zikr meditation music', 'allah hoo sufi kalam', 'sama spiritual listening music'],
      romanUrdu: ['zikr e ilahi sufi kalam', 'allah hoo zikr full song', 'mehfil e sama kalam'],
      urduNastaliq: ['ذکرِ الٰہی صوفی کلام', 'اللہ ہو صوفی ذکر', 'محفلِ سماع عارفانہ کلام'],
      devanagari: ['ज़िक्र-ए-इलाही सूफी कलाम', 'अल्लाह हू सूफी ज़िक्र', 'महफ़िल-ए-समा संगीत'],
    },
  },
  {
    clusterId: 'kashmir-rishi-heritage',
    title: 'Kashmir Rishi Tradition: Nund Rishi & Lal Ded Heritage',
    domain: 'Kashmir Spiritual Heritage',
    intentSummary: 'Cultural & spiritual searchers exploring Sheikh-ul-Alam (Nund Rishi), Lal Ded vakhs, Shah-e-Hamdan, and Kashmir sacred heritage.',
    lexicalTokens: ['rishi', 'nund', 'alamdar', 'lal ded', 'lalla', 'vakh', 'shrukh', 'hamdan', 'kashmir', 'heritage', 'craft'],
    targetTaxonomy: {
      concepts: ['faqr', 'marifa', 'haqiqa'],
      themes: ['spiritual_journey', 'cosmic_order'],
      moods: ['contemplative', 'reflective'],
      regions: ['in', 'pk', 'uk', 'us'],
    },
    multilingualQueries: {
      english: ['nund rishi kashmiri poetry', 'lal ded vakhs music', 'kashmir sufi saints heritage'],
      romanUrdu: ['sheikh ul alam nund rishi shrukh', 'lal ded kashmiri kalam', 'shah e hamdan kashmir'],
      urduNastaliq: ['شیخ العالم نند ریشی کلام', 'لل دید کشمیری واکھ', 'کشمیر کی ریشی صوفی روایت'],
      devanagari: ['नुंद ऋषि कश्मीरी कलाम', 'लल देद वाख और सूफी परंपरा', 'कश्मीर की सूफी विरासत'],
    },
  },
  {
    clusterId: 'sufi-philosophy-fana-baqa-ishq',
    title: 'Sufi Philosophy: Ishq-e-Haqiqi, Fana, Baqa & Self-Knowledge',
    domain: 'Sufi Philosophy',
    intentSummary: 'Seekers exploring inward self-realization (Khudi / Ma\'rifa), annihilation of ego (Fana), Divine subsistence (Baqa), and Ultimate Truth (Haqiqa).',
    lexicalTokens: ['fana', 'baqa', 'haqiqi', 'khud', 'pehchaan', 'mirror', 'aina', 'zaat', 'zarra', 'benishan', 'truth', 'haq', 'ego', 'nafs'],
    targetTaxonomy: {
      concepts: ['fana', 'baqa', 'ishq', 'marifa', 'haqiqa'],
      themes: ['annihilation_fana', 'divine_love', 'seeking_union'],
      moods: ['contemplative', 'reflective'],
      regions: ['in', 'pk', 'bd', 'us', 'uk', 'de'],
    },
    multilingualQueries: {
      english: ['fana and baqa sufi meaning song', 'ishq e haqiqi sufi music', 'know thyself sufi kalam'],
      romanUrdu: ['pehchaan khud ko sufi kalam', 'fana fi allah kalam', 'ishq e haqiqi aur marifat'],
      urduNastaliq: ['فنا اور بقا صوفی کلام', 'عشقِ حقیقی اور معرفتِ نفس', 'پہچان خود کو عارفانہ کلام'],
      devanagari: ['फ़ना और बक़ा सूफी कलाम', 'इश्क़-ए-हक़ीक़ी और आत्मज्ञान', 'खुद को पहचान सूफी गीत'],
    },
  },
  {
    clusterId: 'hamd-naat-manqabat',
    title: 'Sacred Praise: Hamd, Naat & Manqabat',
    domain: 'Devotional Forms',
    intentSummary: 'Global devotional audiences searching for dignified, poetic Hamd, Prophetic Naat, and Manqabat compositions.',
    lexicalTokens: ['hamd', 'naat', 'manqabat', 'mustafa', 'madina', 'nabi', 'rasool', 'ali', 'maula', 'khwaja', 'qalandar'],
    targetTaxonomy: {
      concepts: ['ishq', 'shukr', 'tasawwuf'],
      themes: ['praise_hamd', 'devotion_naat'],
      moods: ['celebratory', 'serene', 'ecstatic'],
      regions: ['pk', 'in', 'bd', 'me', 'uk', 'us', 'my', 'id'],
    },
    multilingualQueries: {
      english: ['soulful sufi hamd and naat', 'manqabat sufi kalam with lyrics', 'khwaja mere khwaja sufi devotional'],
      romanUrdu: ['hamd e bari taala kalam', 'roohani naat sharif', 'manqabat maula ali khwaja'],
      urduNastaliq: ['حمدِ باری تعالیٰ عارفانہ کلام', 'روحانی نعت شریف مع ترجمہ', 'منقبت اور صوفیانہ عقیدت'],
      devanagari: ['रूहानी हम्द और नात शरीफ़', 'मनक़बत सूफी कलाम', 'ख्वाजा और मौला सूफी भक्ति गीत'],
    },
  },
  {
    clusterId: 'classical-saints-poets',
    title: 'Classical Sufi Saints & Mystic Poets Lineage',
    domain: 'Sufi Saints & Poets',
    intentSummary: 'Listeners searching classical kalam traditions of Amir Khusrau, Baba Bulleh Shah, Baba Farid, Rumi, and Sultan Bahu.',
    lexicalTokens: ['khusrau', 'bulleh', 'bulla', 'rumi', 'farid', 'bahu', 'chishti', 'qalandar', 'saint', 'darvesh', 'faqir'],
    targetTaxonomy: {
      concepts: ['tasawwuf', 'faqr', 'ishq'],
      themes: ['divine_love', 'annihilation_fana'],
      moods: ['ecstatic', 'longing'],
      regions: ['in', 'pk', 'bd', 'tr', 'us', 'uk'],
    },
    multilingualQueries: {
      english: ['amir khusrau sufi kalam', 'bulleh shah poetry music', 'rumi mystical sufi songs'],
      romanUrdu: ['bulla ki jaana main kaun kalam', 'amir khusro qawwali kalam', 'baba farid sultan bahu kalam'],
      urduNastaliq: ['امیر خسرو کا صوفی کلام', 'بابا بلھے شاہ عارفانہ کلام', 'مولانا رومی اور صوفی اولیاء'],
      devanagari: ['अमीर ख़ुसरो सूफी कलाम', 'बुल्ले शाह सूफी शायरी गीत', 'सूफी संतों की वाणी और संगीत'],
    },
  },
  {
    clusterId: 'global-diaspora-spiritual-listening',
    title: 'South Asian & Kashmiri Diaspora Spiritual Discovery',
    domain: 'Diaspora Cultural Interests',
    intentSummary: 'Diaspora communities in the US, UK, Canada, UAE, Saudi Arabia, Malaysia, and Europe seeking multilingual subtitled sacred music.',
    lexicalTokens: ['english', 'subtitle', 'translation', 'usa', 'diaspora', 'global', 'heritage', 'journey', 'home', 'footprints'],
    targetTaxonomy: {
      concepts: ['tasawwuf', 'sabr', 'ishq'],
      themes: ['spiritual_journey', 'cosmic_order'],
      moods: ['reflective', 'serene'],
      regions: ['us', 'uk', 'ca', 'de', 'me', 'my'],
    },
    multilingualQueries: {
      english: ['sufi music with english subtitles', 'urdu kalam translated in english', 'sufi pulse usa original songs'],
      romanUrdu: ['sufi kalam english translation ke sath', 'pardes roohani sufi songs', 'urdu hindi english sufi lyrics'],
      urduNastaliq: ['انگریزی ترجمے کے ساتھ صوفی کلام', 'بیرون ملک مقیم سامعین کے لیے عارفانہ کلام', 'کثیر لسانی صوفی موسیقی'],
      devanagari: ['अंग्रेज़ी सबटाइटल के साथ सूफी संगीत', 'प्रवासी भारतीय सूफी कलाम', 'बहुभाषी सूफी गीत'],
    },
  },
];

export function evaluateReleaseScriptCoverage(release: Record<string, any>): ReleaseScriptCoverage {
  const subtitleTranslations = release.subtitleTranslations || release.subtitle_translations || {};
  const subtitleStatuses = release.subtitleLanguageStatuses || release.subtitle_language_statuses || {};
  const lyrics = release.lyrics || {};
  const lyricsStructure = release.lyricsStructure || release.lyrics_structure || {};
  const canonicalLyrics = release.canonicalLyrics || release.canonical_lyrics || null;

  const UNAPPROVED_STATUSES = new Set(['draft', 'in_translation', 'under_review', 'archived']);
  const isTrackApproved = (langKey: string): boolean => {
    const raw = String(subtitleStatuses[langKey] || '').toLowerCase().trim();
    return !UNAPPROVED_STATUSES.has(raw);
  };

  const hasTrackText = (c: string): boolean => {
    const sub = subtitleTranslations[c];
    if (sub && typeof sub === 'object' && Object.values(sub).some((v) => String(v || '').trim().length > 0)) {
      return true;
    }
    const lyr = lyrics[c];
    if (Array.isArray(lyr) && lyr.length > 0) return true;
    if (typeof lyr === 'string' && lyr.trim().length > 0) return true;
    const st = lyricsStructure[c];
    if (Array.isArray(st) && st.length > 0) return true;
    return false;
  };

  const hasApprovedTrack = (candidates: string[]): boolean => {
    for (const c of candidates) {
      if (hasTrackText(c) && isTrackApproved(c)) return true;
    }
    if (
      canonicalLyrics &&
      canonicalLyrics.status === 'APPROVED' &&
      String(canonicalLyrics.rawText || '').trim().length > 0 &&
      candidates.includes(String(canonicalLyrics.primaryLanguage || '').toLowerCase())
    ) {
      return true;
    }
    return false;
  };

  const hasDraftOnlyTrack = (candidates: string[]): boolean => {
    if (hasApprovedTrack(candidates)) return false;
    for (const c of candidates) {
      if (hasTrackText(c) && !isTrackApproved(c)) return true;
    }
    if (
      canonicalLyrics &&
      canonicalLyrics.status !== 'APPROVED' &&
      String(canonicalLyrics.rawText || '').trim().length > 0 &&
      candidates.includes(String(canonicalLyrics.primaryLanguage || '').toLowerCase())
    ) {
      return true;
    }
    return false;
  };

  const enKeys = ['en', 'english'];
  const romKeys = ['roman_urdu', 'roman-urdu', 'ur-latn', 'en-rom', 'ur_roman'];
  const urKeys = ['ur', 'urdu'];
  const devaKeys = ['hi', 'hindi', 'ur-deva'];

  const english = hasApprovedTrack(enKeys);
  const romanUrdu = hasApprovedTrack(romKeys);
  const urduNastaliq = hasApprovedTrack(urKeys);
  const devanagari = hasApprovedTrack(devaKeys);

  const draftPreparedCount = [
    hasDraftOnlyTrack(enKeys),
    hasDraftOnlyTrack(romKeys),
    hasDraftOnlyTrack(urKeys),
    hasDraftOnlyTrack(devaKeys),
  ].filter(Boolean).length;

  const anyTrackAcrossAllKeys =
    Object.keys(subtitleTranslations).some((k) => hasTrackText(k)) ||
    Object.keys(lyrics).some((k) => hasTrackText(k)) ||
    Object.keys(lyricsStructure).some((k) => hasTrackText(k)) ||
    Boolean(canonicalLyrics && String(canonicalLyrics.rawText || '').trim().length > 0);

  const coveredCount = [english, romanUrdu, urduNastaliq, devanagari].filter(Boolean).length;
  return {
    english,
    romanUrdu,
    urduNastaliq,
    devanagari,
    coveredCount,
    draftPreparedCount,
    sourceRecoveryRequired: !anyTrackAcrossAllKeys,
  };
}

export function buildSearchDemandIntelligence(params: {
  youtube?: YouTubeDiscoverySnapshot | null;
  gsc?: GscSearchAnalyticsReport | null;
}): {
  generatedAt: string;
  totalClusters: number;
  totalPublishedSongsAnalyzed: number;
  summary: {
    strongCatalogClusters: number;
    optimizationNeededClusters: number;
    expansionCandidateClusters: number;
    songsWithAllFourScripts: number;
    songsMissingDevanagariOrRomanUrdu: number;
    songsRequiringSourceRecovery: number;
    songsWithStagedDraftScripts: number;
  };
  clusters: SearchDemandClusterReport[];
} {
  const generatedAt = new Date().toISOString();
  const publicReleases = cmsServerStorage
    .getPublicReleases()
    .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');

  graphResolver.init();
  const rawJoins = graphResolver.getRawJoins();
  const studio = getYouTubeStudioSnapshot();
  const studioByVideoId = new Map((studio?.rows ?? []).map((r) => [r.videoId, r]));

  const joinsByReleaseId = new Map<string, number>();
  for (const j of rawJoins) {
    if (j.releaseId) {
      joinsByReleaseId.set(j.releaseId, (joinsByReleaseId.get(j.releaseId) || 0) + 1);
    }
  }

  let songsWithAllFourScripts = 0;
  let songsMissingDevanagariOrRomanUrdu = 0;
  let songsRequiringSourceRecovery = 0;
  let songsWithStagedDraftScripts = 0;
  for (const r of publicReleases) {
    const cov = evaluateReleaseScriptCoverage(r);
    if (cov.coveredCount === 4) songsWithAllFourScripts++;
    if (!cov.devanagari || !cov.romanUrdu) songsMissingDevanagariOrRomanUrdu++;
    if (cov.sourceRecoveryRequired) songsRequiringSourceRecovery++;
    if ((cov.draftPreparedCount || 0) > 0) songsWithStagedDraftScripts++;
  }

  const yt28Terms = params.youtube?.recent28d?.searchTerms || [];
  const ytLifeTerms = params.youtube?.lifetimeSearchTerms?.rows || [];
  const gscQueries = params.gsc?.status === 'CONNECTED' ? params.gsc.topQueries : null;

  const clusters: SearchDemandClusterReport[] = SUFI_SEARCH_DEMAND_CLUSTERS.map((cluster) => {
    const matchedReleases: MatchedClusterRelease[] = [];

    for (const r of publicReleases) {
      const reasons: string[] = [];
      const titleDesc = `${r.canonicalTitle || ''} ${r.title || ''} ${r.description || ''} ${(r.tags || []).join(' ')}`.toLowerCase();

      const conceptOverlap = (r.sufiConcepts || []).filter((c) => cluster.targetTaxonomy.concepts.includes(c));
      if (conceptOverlap.length > 0) reasons.push(`concept:${conceptOverlap.join(',')}`);

      const themeOverlap = (r.themes || []).filter((t) => cluster.targetTaxonomy.themes.includes(t));
      if (themeOverlap.length > 0) reasons.push(`theme:${themeOverlap.join(',')}`);

      const moodOverlap = (r.moods || []).filter((m) => cluster.targetTaxonomy.moods.includes(m));
      if (moodOverlap.length > 0) reasons.push(`mood:${moodOverlap.join(',')}`);

      const tokenHits = cluster.lexicalTokens.filter((tok) => titleDesc.includes(tok.toLowerCase()));
      if (tokenHits.length > 0) reasons.push(`lexical:${tokenHits.slice(0, 3).join(',')}`);

      if (reasons.length === 0) continue;

      const scriptCoverage = evaluateReleaseScriptCoverage(r);
      const graphConnectionsCount = joinsByReleaseId.get(r.id) || 0;
      const st = r.youtubeId ? studioByVideoId.get(r.youtubeId) : undefined;

      const missingScripts: string[] = [];
      if (!scriptCoverage.english) missingScripts.push('English');
      if (!scriptCoverage.romanUrdu) missingScripts.push('Roman Urdu');
      if (!scriptCoverage.urduNastaliq) missingScripts.push('Urdu Nastaliq');
      if (!scriptCoverage.devanagari) missingScripts.push('Devanagari');

      let optimizationGap: string | null = null;
      if (graphConnectionsCount === 0) {
        optimizationGap = 'Connect song to Discovery Graph concepts/themes/regions';
      } else if (missingScripts.length > 0) {
        optimizationGap = `Add ${missingScripts.join(' + ')} lyrics/subtitles`;
      } else if (st?.ctr !== null && st?.ctr !== undefined && st.ctr < 4.5) {
        optimizationGap = `Improve YouTube title Variant B/C & thumbnail packaging (Studio CTR ${st.ctr}%)`;
      }

      matchedReleases.push({
        id: r.id,
        slug: r.slug,
        canonicalTitle: resolveCanonicalSongTitle(r),
        youtubeId: r.youtubeId || null,
        matchReasons: reasons,
        totalViews: Number(r.viewCount || st?.views || 0),
        studioImpressions: st?.impressions ?? null,
        studioCtr: st?.ctr ?? null,
        graphConnectionsCount,
        scriptCoverage,
        optimizationGap,
      });
    }

    matchedReleases.sort((a, b) => b.totalViews - a.totalViews);

    // Measure actual observed search queries matching this cluster's tokens
    const matchesClusterTerm = (q: string) => {
      const lower = q.toLowerCase();
      return cluster.lexicalTokens.some((tok) => lower.includes(tok.toLowerCase()));
    };

    const matchedYt28 = yt28Terms.filter((t) => matchesClusterTerm(t.term));
    const matchedYtLife = ytLifeTerms.filter((t) => matchesClusterTerm(t.term));
    const matchedGsc = gscQueries ? gscQueries.filter((q) => matchesClusterTerm(q.query)) : null;

    const fourScriptReadyCount = matchedReleases.filter((m) => m.scriptCoverage.coveredCount === 4).length;
    const graphConnectedCount = matchedReleases.filter((m) => m.graphConnectionsCount > 0).length;
    const totalCatalogViewsInCluster = matchedReleases.reduce((s, m) => s + m.totalViews, 0);

    let status: SearchDemandClusterReport['existingCatalogCoverage']['status'] =
      'STRONG_CATALOG_MATCH';
    if (matchedReleases.length < 3) {
      status = 'CATALOG_EXPANSION_CANDIDATE';
    } else if (graphConnectedCount < matchedReleases.length || fourScriptReadyCount < Math.ceil(matchedReleases.length * 0.5)) {
      status = 'METADATA_OPTIMIZATION_NEEDED';
    }

    const recommendedAction =
      matchedReleases.length === 0
        ? `Tag existing SufiPulse full-length releases with ${cluster.targetTaxonomy.concepts[0] || 'relevant'} concepts before commissioning new songs.`
        : status === 'METADATA_OPTIMIZATION_NEEDED'
          ? `Optimize ${matchedReleases.length} existing full-length songs: link ${matchedReleases.length - graphConnectedCount} unlinked songs in Discovery Graph and complete 4-script lyrics (Roman Urdu / اردو / देवनागरी / English) on top releases.`
          : `Promote top full-length song "${matchedReleases[0].canonicalTitle}" via internal Discovery Graph links and YouTube Variant B/C title packaging.`;

    return {
      clusterId: cluster.clusterId,
      title: cluster.title,
      domain: cluster.domain,
      intentSummary: cluster.intentSummary,
      targetTaxonomy: cluster.targetTaxonomy,
      multilingualQueries: cluster.multilingualQueries,
      measuredSignals: {
        youtubeSearchViews28d: matchedYt28.reduce((s, t) => s + t.views, 0),
        youtubeSearchViewsLifetime: matchedYtLife.reduce((s, t) => s + t.views, 0),
        matchedYoutubeQueries: Array.from(
          new Set([...matchedYt28.map((t) => t.term), ...matchedYtLife.map((t) => t.term)])
        ).slice(0, 8),
        gscClicks28d: matchedGsc ? matchedGsc.reduce((s, q) => s + q.clicks, 0) : null,
        gscImpressions28d: matchedGsc ? matchedGsc.reduce((s, q) => s + q.impressions, 0) : null,
        signalProvenance: gscQueries
          ? 'Live YouTube Analytics API v2 (YT_SEARCH) + Google Search Console API'
          : 'Live YouTube Analytics API v2 (YT_SEARCH); Google Search Console NOT CONFIGURED',
      },
      existingCatalogCoverage: {
        matchedReleasesCount: matchedReleases.length,
        totalCatalogViewsInCluster,
        fourScriptReadyCount,
        graphConnectedCount,
        status,
      },
      matchedReleases: matchedReleases.slice(0, 8),
      recommendedAction,
    };
  });

  return {
    generatedAt,
    totalClusters: clusters.length,
    totalPublishedSongsAnalyzed: publicReleases.length,
    summary: {
      strongCatalogClusters: clusters.filter((c) => c.existingCatalogCoverage.status === 'STRONG_CATALOG_MATCH').length,
      optimizationNeededClusters: clusters.filter(
        (c) => c.existingCatalogCoverage.status === 'METADATA_OPTIMIZATION_NEEDED'
      ).length,
      expansionCandidateClusters: clusters.filter(
        (c) => c.existingCatalogCoverage.status === 'CATALOG_EXPANSION_CANDIDATE'
      ).length,
      songsWithAllFourScripts,
      songsMissingDevanagariOrRomanUrdu,
      songsRequiringSourceRecovery,
      songsWithStagedDraftScripts,
    },
    clusters,
  };
}
