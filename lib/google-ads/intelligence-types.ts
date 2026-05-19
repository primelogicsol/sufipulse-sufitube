// lib/google-ads/intelligence-types.ts

export type LanguageCode = 'ur' | 'ks' | 'pa' | 'en';

export type GeographicRegion = {
  countryCode: string;
  name: string;
  isPrimary: boolean;
  isDiaspora: boolean;
  cities?: string[];
  weight: number; // 0-1
};

export type LanguageProfile = {
  code: LanguageCode;
  name: string;
  primaryRegions: GeographicRegion[];
  secondaryRegions: GeographicRegion[];
  diasporaZones: GeographicRegion[];
  behavioralPatterns: string[];
  spiritualAffinity: string[];
  preferredFormats: string[];
  sensitivities: string[];
  adTone: string;
  tendencies: {
    nightListening: boolean;
    mobileFirst: boolean;
    longFormAffinity: boolean;
    subtitleUsage: boolean;
  };
};

export type KeywordCluster = {
  id: string;
  label: string;
  category: 'core_devotional' | 'emotional_healing' | 'identity_heritage' | 'ritual_practice' | 'intellectual_mysticism' | 'long_tail' | 'seasonal' | 'diaspora' | 'music' | 'negative';
  keywords: string[];
};

export type AudienceCluster = {
  id: string;
  label: string;
  behavioralIntent: string;
  recommendedKeywords: string[];
  demographicTendency: string;
  contentSuitability: string[];
  recommendedFormat: string;
  exclusions: string[];
};

export type TargetingPreset = {
  id: string;
  title: string;
  description: string;
  campaignObjective: string;
  keywordClusters: string[]; // Cluster IDs
  negativeKeywords: string[];
  audienceArchetypes: string[]; // Cluster IDs
  regions: string[]; // Country Codes
  languages: LanguageCode[];
  placementCategories: string[];
  recommendedFormats: string[];
  budgetProfile: 'low' | 'medium' | 'high' | 'institutional';
  riskNotes?: string;
  bestUseCases: string[];
  sensitivityNotes: string;
};

export type CampaignStrategyTemplate = {
  releaseType: string;
  objective: string;
  suggestedPresets: string[];
  audienceClusters: string[];
  keywordLayers: string[];
  recommendedBudgetBand: string;
  expectedFunnelStage: 'awareness' | 'consideration' | 'conversion';
  adCopyFraming: string;
  operationalNotes: string;
};

export type CulturalSemantic = {
  id: string;
  label: string;
  description: string;
  audienceTags: string[];
  framingHints: string;
};

export type IntelligencePlan = {
  adoptionId: string;
  selectedPresets: string[];
  selectedLanguages: LanguageCode[];
  selectedSemantics: string[];
  customKeywords: string[];
  customNegativeKeywords: string[];
  customAudienceClusters: string[];
  proposedTargeting: string;
  proposedBudget: number;
  proposedAdCopy: string;
  internalNotes: string;
  sponsorSafeSummary: {
    objective: string;
    regions: string[];
    languages: string[];
    audienceSummary: string;
    resonanceProfile: string;
    culturalOverview: string;
  };
  preparedBy?: string;
  preparedAt?: string;
};
