// lib/google-ads/intelligence-library.ts
import { LanguageProfile, KeywordCluster, AudienceCluster, TargetingPreset, CampaignStrategyTemplate, CulturalSemantic } from './intelligence-types';

export const LANGUAGE_PROFILES: LanguageProfile[] = [
  {
    code: 'ur',
    name: 'Urdu',
    primaryRegions: [
      { countryCode: 'PK', name: 'Pakistan', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'IN', name: 'India', isPrimary: true, isDiaspora: false, cities: ['Jammu & Kashmir', 'Delhi', 'UP', 'Hyderabad'], weight: 0.9 },
      { countryCode: 'AE', name: 'UAE', isPrimary: true, isDiaspora: true, weight: 0.7 },
      { countryCode: 'SA', name: 'Saudi Arabia', isPrimary: true, isDiaspora: true, weight: 0.7 },
    ],
    secondaryRegions: [
      { countryCode: 'QA', name: 'Qatar', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'KW', name: 'Kuwait', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'OM', name: 'Oman', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'BH', name: 'Bahrain', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'ZA', name: 'South Africa', isPrimary: false, isDiaspora: true, weight: 0.3 },
    ],
    diasporaZones: [
      { countryCode: 'GB', name: 'United Kingdom', isPrimary: false, isDiaspora: true, cities: ['Bradford', 'Birmingham', 'London'], weight: 0.6 },
      { countryCode: 'US', name: 'USA', isPrimary: false, isDiaspora: true, cities: ['Houston', 'Chicago'], weight: 0.5 },
      { countryCode: 'CA', name: 'Canada', isPrimary: false, isDiaspora: true, cities: ['Toronto', 'Mississauga'], weight: 0.5 },
    ],
    behavioralPatterns: ['Poetry affinity', 'Ghazal/Qawwali interest', 'Nostalgia-driven', 'Night listening tendency'],
    spiritualAffinity: ['Islamic reflection', 'Sufi Kalam', 'Emotional devotional'],
    preferredFormats: ['Long-form spoken', 'Live Qawwali videos', 'Poetic recitations'],
    sensitivities: ['Religious sanctity', 'Poetic meter accuracy', 'Regional dialect nuances'],
    adTone: 'Respectful, Poetic, Emotional, Traditional',
    tendencies: { nightListening: true, mobileFirst: true, longFormAffinity: true, subtitleUsage: true }
  },
  {
    code: 'ks',
    name: 'Kashmiri',
    primaryRegions: [
      { countryCode: 'IN', name: 'Jammu & Kashmir', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'PK', name: 'Azad Kashmir', isPrimary: true, isDiaspora: false, weight: 1 },
    ],
    secondaryRegions: [],
    diasporaZones: [
      { countryCode: 'GB', name: 'United Kingdom', isPrimary: false, isDiaspora: true, weight: 0.5 },
      { countryCode: 'SA', name: 'Saudi Arabia', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'AE', name: 'UAE', isPrimary: false, isDiaspora: true, weight: 0.4 },
      { countryCode: 'US', name: 'USA', isPrimary: false, isDiaspora: true, weight: 0.3 },
      { countryCode: 'CA', name: 'Canada', isPrimary: false, isDiaspora: true, weight: 0.3 },
    ],
    behavioralPatterns: ['Heritage identity', 'Homeland nostalgia', 'Language preservation', 'Shrine culture'],
    spiritualAffinity: ['Sufi Kalam', 'Spiritual longing', 'Folk-Sufi overlap'],
    preferredFormats: ['Slow contemplative', 'Traditional folk', 'Poetic gatherings'],
    sensitivities: ['Cultural authenticity', 'Political neutrality', 'Shrine sanctity'],
    adTone: 'Nostalgic, Contemplative, Authentic, Sacred',
    tendencies: { nightListening: true, mobileFirst: true, longFormAffinity: true, subtitleUsage: false }
  },
  {
    code: 'pa',
    name: 'Punjabi',
    primaryRegions: [
      { countryCode: 'PK', name: 'Punjab (Pakistan)', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'IN', name: 'Punjab (India)', isPrimary: true, isDiaspora: false, cities: ['Haryana', 'Delhi NCR'], weight: 1 },
    ],
    secondaryRegions: [],
    diasporaZones: [
      { countryCode: 'CA', name: 'Canada', isPrimary: false, isDiaspora: true, weight: 0.8 },
      { countryCode: 'GB', name: 'United Kingdom', isPrimary: false, isDiaspora: true, weight: 0.7 },
      { countryCode: 'US', name: 'USA', isPrimary: false, isDiaspora: true, cities: ['California', 'New York'], weight: 0.6 },
      { countryCode: 'AU', name: 'Australia', isPrimary: false, isDiaspora: true, weight: 0.5 },
      { countryCode: 'IT', name: 'Italy', isPrimary: false, isDiaspora: true, weight: 0.4 },
    ],
    behavioralPatterns: ['Strong music discovery', 'Community sharing', 'High short-form engagement'],
    spiritualAffinity: ['Sufi Punjabi', 'Sikh spiritual', 'Qawwali fusion'],
    preferredFormats: ['Energetic devotional', 'Modern folk fusion', 'Short-form social'],
    sensitivities: ['Inter-community harmony', 'Linguistic variation (Gurmukhi/Shahmukhi)'],
    adTone: 'Vibrant, Soulful, Community-oriented, Powerful',
    tendencies: { nightListening: false, mobileFirst: true, longFormAffinity: false, subtitleUsage: true }
  },
  {
    code: 'en',
    name: 'English',
    primaryRegions: [
      { countryCode: 'US', name: 'USA', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'GB', name: 'United Kingdom', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'CA', name: 'Canada', isPrimary: true, isDiaspora: false, weight: 1 },
      { countryCode: 'AU', name: 'Australia', isPrimary: true, isDiaspora: false, weight: 1 },
    ],
    secondaryRegions: [
      { countryCode: 'DE', name: 'Germany', isPrimary: false, isDiaspora: false, weight: 0.5 },
      { countryCode: 'NL', name: 'Netherlands', isPrimary: false, isDiaspora: false, weight: 0.5 },
      { countryCode: 'SE', name: 'Sweden', isPrimary: false, isDiaspora: false, weight: 0.4 },
    ],
    diasporaZones: [],
    behavioralPatterns: ['Spiritual seekers', 'Meditation focus', 'Intellectual curiosity'],
    spiritualAffinity: ['Comparative mysticism', 'Philosophical Sufism', 'Sacred music'],
    preferredFormats: ['Podcasts', 'Intellectual documentaries', 'Ambient meditation'],
    sensitivities: ['Terminology accuracy', 'Non-dogmatic approach', 'Aesthetic quality'],
    adTone: 'Intellectual, Calm, Universal, High-quality',
    tendencies: { nightListening: true, mobileFirst: false, longFormAffinity: true, subtitleUsage: true }
  }
];

export const KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    id: 'core_sufi',
    label: 'Core Sufi',
    category: 'core_devotional',
    keywords: ['sufism', 'tasawwuf', 'sufi kalam', 'mysticism', 'spiritual path', 'ishq e ilahi']
  },
  {
    id: 'healing_contemplation',
    label: 'Healing & Contemplation',
    category: 'emotional_healing',
    keywords: ['spiritual healing', 'inner peace', 'meditation', 'contemplative music', 'soul rest', 'peaceful silence']
  },
  {
    id: 'heritage_nostalgia',
    label: 'Heritage & Nostalgia',
    category: 'identity_heritage',
    keywords: ['homeland memory', 'cultural heritage', 'language preservation', 'ancestral roots', 'nostalgic poetry']
  },
  {
    id: 'intellectual_mystic',
    label: 'Intellectual Mysticism',
    category: 'intellectual_mysticism',
    keywords: ['sufi philosophy', 'comparative religion', 'mystical thought', 'metaphysics', 'spiritual wisdom']
  },
  {
    id: 'qawwali_intent',
    label: 'Qawwali Devotional',
    category: 'music',
    keywords: ['live qawwali', 'nusrat fateh ali khan', 'sabri brothers', 'devotional singing', 'sama session']
  },
  {
    id: 'general_negative',
    label: 'General Exclusions',
    category: 'negative',
    keywords: ['bollywood', 'commercial pop', 'gossip', 'news politics', 'gaming', 'funny videos']
  }
];

export const AUDIENCE_CLUSTERS: AudienceCluster[] = [
  {
    id: 'seeker_intellectual',
    label: 'Spiritual Seeker (Intellectual)',
    behavioralIntent: 'Looking for depth, meaning, and philosophical grounding',
    recommendedKeywords: ['sufi philosophy', 'mystical wisdom', 'inner transformation'],
    demographicTendency: '25-55, urban, educated',
    contentSuitability: ['Spoken reflections', 'Documentaries', 'Literary Kalam'],
    recommendedFormat: 'Long-form Video / Podcast',
    exclusions: ['Commercial pop', 'Surface-level viral content']
  },
  {
    id: 'devotional_traditional',
    label: 'Devotional Traditionalist',
    behavioralIntent: 'Focused on ritual, classic kalam, and emotional connection',
    recommendedKeywords: ['sufi kalam', 'classic qawwali', 'shrine music'],
    demographicTendency: '35+, multi-regional',
    contentSuitability: ['Qawwali', 'Classic Sufi Songs', 'Heritage Kalam'],
    recommendedFormat: 'Live Performance / Recitation',
    exclusions: ['Modern electronic fusion']
  },
  {
    id: 'youth_discovery',
    label: 'Youth Discovery',
    behavioralIntent: 'Curious about roots, modern spiritual aesthetics, and community',
    recommendedKeywords: ['modern sufi', 'spiritual beats', 'identity journey'],
    demographicTendency: '18-30, diaspora + urban native',
    contentSuitability: ['Short Promos', 'Sufi Songs (Modern)', 'Visual Reflections'],
    recommendedFormat: 'Short-form / Social Video',
    exclusions: ['Static/Slow lectures']
  }
];

export const TARGETING_PRESETS: TargetingPreset[] = [
  {
    id: 'global_sufi_audience',
    title: 'Global Sufi Audience',
    description: 'Wide reach across spiritual and mystical interest groups worldwide.',
    campaignObjective: 'awareness',
    keywordClusters: ['core_sufi', 'intellectual_mystic'],
    negativeKeywords: ['bollywood', 'pop'],
    audienceArchetypes: ['seeker_intellectual'],
    regions: ['PK', 'IN', 'AE', 'SA', 'GB', 'US', 'CA'],
    languages: ['ur', 'en'],
    placementCategories: ['Religion & Spirituality', 'Philosophy', 'World Music'],
    recommendedFormats: ['Full Release', 'Spoken Reflection'],
    budgetProfile: 'high',
    bestUseCases: ['Major platform announcements', 'Institutional awareness'],
    sensitivityNotes: 'Ensure ad copy uses universal spiritual terminology.'
  },
  {
    id: 'urdu_spiritual_poetry',
    title: 'Urdu Spiritual Poetry',
    description: 'Targeted at lovers of Urdu Adab and deep spiritual kalam.',
    campaignObjective: 'awareness',
    keywordClusters: ['core_sufi', 'heritage_nostalgia'],
    negativeKeywords: ['funny', 'news'],
    audienceArchetypes: ['devotional_traditional'],
    regions: ['PK', 'IN', 'AE', 'SA', 'GB'],
    languages: ['ur'],
    placementCategories: ['Literature', 'Poetry', 'Traditional Music'],
    recommendedFormats: ['Literary Kalam', 'Qawwali'],
    budgetProfile: 'medium',
    bestUseCases: ['Kalam releases', 'Poetry recitations'],
    sensitivityNotes: 'Use respectful titles and honorifics in ad copy.'
  }
];

export const CAMPAIGN_STRATEGY_TEMPLATES: CampaignStrategyTemplate[] = [
  {
    releaseType: 'Qawwali',
    objective: 'awareness',
    suggestedPresets: ['urdu_spiritual_poetry'],
    audienceClusters: ['devotional_traditional'],
    keywordLayers: ['qawwali_intent', 'core_sufi'],
    recommendedBudgetBand: '$100 - $500',
    expectedFunnelStage: 'awareness',
    adCopyFraming: 'Experience the raw power of traditional Sama and sacred devotion.',
    operationalNotes: 'Monitor high-engagement timestamps (Thursday/Friday nights).'
  },
  {
    releaseType: 'Spoken Reflection',
    objective: 'awareness',
    suggestedPresets: ['global_sufi_audience'],
    audienceClusters: ['seeker_intellectual'],
    keywordLayers: ['intellectual_mystic', 'healing_contemplation'],
    recommendedBudgetBand: '$50 - $250',
    expectedFunnelStage: 'consideration',
    adCopyFraming: 'A moment of stillness in a chaotic world. Contemplate the path within.',
    operationalNotes: 'Best for weekday evening audiences looking for reflective content.'
  }
];

export const CULTURAL_SEMANTICS: CulturalSemantic[] = [
  {
    id: 'mystical_longing',
    label: 'Mystical Longing',
    description: 'The search for the divine beloved and inner union.',
    audienceTags: ['Soul Seeker', 'Mystical Romantic'],
    framingHints: 'Use themes of yearning, path, and union.'
  },
  {
    id: 'homeland_nostalgia',
    label: 'Homeland Nostalgia',
    description: 'Emotional connection to ancestral spiritual landscapes.',
    audienceTags: ['Diaspora Heritage', 'Memory Keeper'],
    framingHints: 'Focus on roots, language, and cultural continuity.'
  },
  {
    id: 'sacred_silence',
    label: 'Sacred Silence',
    description: 'The meditative power of inner quiet and reflection.',
    audienceTags: ['Meditation Focus', 'Inner Calm'],
    framingHints: 'Use minimalist copy, focusing on rest and soul healing.'
  }
];
