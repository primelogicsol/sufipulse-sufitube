/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS ENGINE — Core Type Definitions
 * ═══════════════════════════════════════════════════════════════════
 * 
 * THE FOUNDATIONAL RULE:
 * An entity does not exist to be stored.
 * An entity exists to increase:
 *   1. SufiPulse authority
 *   2. SufiPulse discoverability
 *   3. SufiPulse citations
 *   4. SufiPulse-USA audience growth
 * 
 * If it serves none of these goals, it should not be published.
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// ENTITY TYPES
// ─────────────────────────────────────────────────────────────────

export const ENTITY_TYPES = [
  'song', 'artist', 'poet', 'saint', 'concept', 'tradition',
  'order', 'language', 'region', 'institution', 'festival',
  'album', 'performance', 'video', 'publication', 'playlist',
  'release',  // SufiPulse original releases (from existing CMS)
] as const;

export type EntityType = typeof ENTITY_TYPES[number];

export const ENTITY_STATUS = ['draft', 'review', 'published', 'archived'] as const;
export type EntityStatus = typeof ENTITY_STATUS[number];

export const VERIFICATION_STATUS = [
  'unverified', 'web_verified', 'community_verified', 'expert_verified', 'institutional_verified'
] as const;
export type VerificationStatus = typeof VERIFICATION_STATUS[number];

// ─────────────────────────────────────────────────────────────────
// CORE ENTITY INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface AtlasEntity {
  // Identity
  id: string;
  entityType: EntityType;
  slug: string;
  canonicalName: string;

  // Multilingual
  nameTransliterations: Record<string, string>;
  nameTranslations: Record<string, string>;
  alternateNames: string[];

  // Content
  shortDescription: string;       // Min 40 words for publication
  longDescription: string;        // Min 150 words for publication

  // ── THE 5 SCORES ──────────────────────────────────────────────
  connectionScore: number;          // 0-100: How close to SufiPulse content?
  authorityOpportunityScore: number;// 0-100: How much search power?
  audienceCaptureScore: number;     // 0-100: Will visitors convert?
  seedAuthorityScore: number;       // 0-100: Already globally recognized?
  advantageScore: number;           // 0-100: Can SufiPulse WIN this topic?

  // Combined
  strategicGPS: number;             // 0-100: Weighted combination
  // GPS = (connection × 0.20) + (authority × 0.20) + (capture × 0.15) 
  //      + (seed × 0.20) + (advantage × 0.25)
  discoveryReadinessScore: number;  // 0-100: Readiness for public discovery
  releaseConnectionStrength: number;// 0-100: Strength of connection to original release

  // ── ADVANTAGE SUB-SCORES ──────────────────────────────────────
  contentGapScore: number;          // 0-35
  winProbability: number;           // 0-30
  competitionLevel: CompetitionLevel;

  // ── CONVERSION FIELDS ─────────────────────────────────────────
  conversionTier: 1 | 2 | 3 | 4 | 5;
  hopsToSufiPulseContent: number;   // Calculated
  hopsToYouTube: number;            // Calculated
  sufipulseJustification: string;   // Required: "How does this connect to SufiPulse?"
  sufipulseInterpretation?: string; // Optional: Unique editorial voice for the bottom section
  connectedReleaseIds: string[];
  connectedVideoIds: string[];
  connectedArticleIds: string[];

  // ── RECOMMENDED ASSET ─────────────────────────────────────────
  recommendedAsset: RecommendedAsset;

  // ── STRATEGIC DOMAINS ─────────────────────────────────────────
  primaryDomain: StrategicDomainId;
  secondaryDomain?: StrategicDomainId;

  // ── EXTERNAL REFERENCES ───────────────────────────────────────
  wikidataId?: string;
  musicbrainzId?: string;
  sameAs: string[];
  sourceReferences: string[];

  // ── AUTHORITY METADATA ────────────────────────────────────────
  authorityMetadata?: Record<string, string | string[]>;

  // Schema.org
  schemaType: string;

  // Status
  status: EntityStatus;
  isPublic: boolean;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  recommendedAction: RecommendedAction;

  // Search
  searchIntent?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// RELATIONSHIP TYPES
// ─────────────────────────────────────────────────────────────────

export const RELATIONSHIP_FAMILIES = [
  'musical', 'literary', 'spiritual', 'geographic', 'content', 'meta'
] as const;
export type RelationshipFamily = typeof RELATIONSHIP_FAMILIES[number];

/** Musical Relationships */
export const MUSICAL_RELATIONSHIPS = [
  'performed_by', 'composed_by', 'appears_on', 'recorded_at',
  'belongs_to_tradition', 'sung_in', 'in_raga',
] as const;

/** Literary Relationships */
export const LITERARY_RELATIONSHIPS = [
  'written_by', 'adapted_from', 'expresses_concept', 'uses_poetic_form',
  'wrote_in', 'major_work',
] as const;

/** Spiritual Relationships */
export const SPIRITUAL_RELATIONSHIPS = [
  'dedicated_to', 'affiliated_with_order', 'murshid_of', 'murid_of',
  'founded_order', 'buried_at', 'honored_at', 'devoted_to', 'teaches_concept',
] as const;

/** Geographic Relationships */
export const GEOGRAPHIC_RELATIONSHIPS = [
  'from_region', 'active_in', 'located_in', 'held_in',
] as const;

/** Content Relationships (SufiPulse-specific) */
export const CONTENT_RELATIONSHIPS = [
  'featured_in_release', 'credited_in_release', 'tagged_in_release',
  'discussed_in_article', 'included_in_playlist', 'has_youtube_video',
  'has_youtube_short', 'mentioned_in_video_desc',
] as const;

/** Meta Relationships */
export const META_RELATIONSHIPS = [
  'teacher_of', 'student_of', 'collaborator', 'contemporary_of',
  'related_to', 'influenced_by', 'influenced', 'same_tradition_as',
] as const;

export const ALL_RELATIONSHIPS = [
  ...MUSICAL_RELATIONSHIPS,
  ...LITERARY_RELATIONSHIPS,
  ...SPIRITUAL_RELATIONSHIPS,
  ...GEOGRAPHIC_RELATIONSHIPS,
  ...CONTENT_RELATIONSHIPS,
  ...META_RELATIONSHIPS,
] as const;

export type RelationshipType = typeof ALL_RELATIONSHIPS[number];

/** Relationship type constraints: which entity types can be source/target */
export const RELATIONSHIP_CONSTRAINTS: Record<string, { sources: EntityType[]; targets: EntityType[] }> = {
  // Musical
  performed_by:          { sources: ['song'],    targets: ['artist'] },
  composed_by:           { sources: ['song'],    targets: ['artist'] },
  appears_on:            { sources: ['song'],    targets: ['album'] },
  belongs_to_tradition:  { sources: ['song', 'artist'], targets: ['tradition'] },
  sung_in:               { sources: ['song'],    targets: ['language'] },

  // Literary
  written_by:            { sources: ['song'],    targets: ['poet'] },
  expresses_concept:     { sources: ['song'],    targets: ['concept'] },
  wrote_in:              { sources: ['poet'],    targets: ['language'] },

  // Spiritual
  dedicated_to:          { sources: ['song'],    targets: ['saint'] },
  affiliated_with_order: { sources: ['artist', 'poet', 'saint'], targets: ['order'] },
  murshid_of:            { sources: ['saint'],   targets: ['saint'] },
  murid_of:              { sources: ['saint'],   targets: ['saint'] },
  founded_order:         { sources: ['saint'],   targets: ['order'] },
  buried_at:             { sources: ['saint'],   targets: ['institution'] },
  honored_at:            { sources: ['saint'],   targets: ['festival'] },
  devoted_to:            { sources: ['poet'],    targets: ['saint'] },
  teaches_concept:       { sources: ['saint'],   targets: ['concept'] },

  // Geographic
  from_region:           { sources: ['artist', 'poet', 'saint'], targets: ['region'] },
  active_in:             { sources: ['artist', 'poet', 'saint', 'order'], targets: ['region'] },
  located_in:            { sources: ['institution', 'festival'], targets: ['region'] },

  // Content (SufiPulse-specific)
  featured_in_release:   { sources: ['song', 'artist', 'poet'], targets: ['release'] },
  credited_in_release:   { sources: ['artist', 'poet'],  targets: ['release'] },
  tagged_in_release:     { sources: ['concept', 'tradition', 'region', 'language'], targets: ['release'] },
  discussed_in_article:  { sources: ['song', 'artist', 'poet', 'saint', 'concept'], targets: ['publication'] },
  has_youtube_video:     { sources: ['release'],  targets: ['video'] },
};

// ─────────────────────────────────────────────────────────────────
// GRAPH EDGE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface AtlasRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  family: RelationshipFamily;

  // Quality
  confidence: number;                // 0.0–1.0
  verification: VerificationStatus;
  sourceAttribution?: string;

  // Conversion impact
  createsConversionPath: boolean;
  conversionPathDelta: number;       // Hops saved by this edge

  // Authority impact
  authorityFlowWeight: number;       // 0.0–1.0

  // Ordering
  sortOrder?: number;
  context?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// AUTHORITY FLOW WEIGHTS BY RELATIONSHIP FAMILY
// ─────────────────────────────────────────────────────────────────

export const AUTHORITY_FLOW_WEIGHTS: Record<RelationshipFamily, number> = {
  musical:     0.8,
  literary:    0.6,
  spiritual:   0.5,
  geographic:  0.3,
  content:     1.0,   // Direct SufiPulse connection = maximum flow
  meta:        0.2,
};

// ─────────────────────────────────────────────────────────────────
// STRATEGIC DOMAINS
// ─────────────────────────────────────────────────────────────────

export const STRATEGIC_DOMAIN_IDS = [
  'kashmiri-sufi',
  'sufipulse-originals',
  'sufi-poetry',
  'sufi-song-interpretation',
  'sufi-heritage',
  'sufi-saints',
  'sufi-concepts',
  'sufi-science',
  'sufi-literature',
  'global-discovery',
] as const;

export type StrategicDomainId = typeof STRATEGIC_DOMAIN_IDS[number];

export interface StrategicDomain {
  id: StrategicDomainId;
  domainName: string;
  description: string;
  currentAuthority: number;      // 0-100
  targetAuthority: number;       // 0-100
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  targetDate: string;
  entityCount: number;
  publishedCount: number;
  convertingCount: number;
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────────
// SCORING TYPES
// ─────────────────────────────────────────────────────────────────

export type CompetitionLevel = 'none' | 'weak' | 'moderate' | 'strong' | 'dominant' | 'unknown';
export type RecommendedAction = 'publish' | 'defer' | 'productionCandidate' | 'referenceOnly' | 'reject';

export interface RecommendedAsset {
  assetType: 'release' | 'video' | 'article' | 'playlist' | 'literary_work' | 'production_candidate';
  assetId?: string;
  assetTitle?: string;
  productionNotes?: string;
  productionPriority?: 'urgent' | 'high' | 'medium' | 'low';
  entitiesUnlocked?: number;
}

export interface GPSWeights {
  connection: number;    // 0.20
  authority: number;     // 0.20
  capture: number;       // 0.15
  seedAuthority: number; // 0.20
  advantage: number;     // 0.25
}

export const DEFAULT_GPS_WEIGHTS: GPSWeights = {
  connection: 0.20,
  authority: 0.20,
  capture: 0.15,
  seedAuthority: 0.20,
  advantage: 0.25,
};

// ─────────────────────────────────────────────────────────────────
// CONVERSION TYPES
// ─────────────────────────────────────────────────────────────────

export const CONVERSION_EDGE_TYPES = [
  'featured_in_release', 'credited_in_release', 'tagged_in_release',
  'discussed_in_article', 'included_in_playlist',
] as const;

export type ConversionEdgeType = typeof CONVERSION_EDGE_TYPES[number];

export interface ConversionPath {
  entityId: string;
  hops: number;
  path: string[];           // Entity IDs in the path
  terminalAssetType: 'release' | 'article' | 'playlist';
  terminalAssetId: string;
  hasYouTubeVideo: boolean;
}

// ─────────────────────────────────────────────────────────────────
// GRAPH QUERY TYPES
// ─────────────────────────────────────────────────────────────────

export interface ProductionCandidate {
  entityId: string;
  entityName: string;
  productionNotes: string;
  entitiesUnlocked: number;
  totalGPSUnlocked: number;
  primaryDomain: StrategicDomainId;
  productionPriority: number;      // Calculated composite priority
}

export interface OrphanEntity {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  strategicGPS: number;
  advantageScore: number;
  primaryDomain: StrategicDomainId;
  nearestContentHops: number | null;
}

export interface DomainReport {
  domainId: StrategicDomainId;
  domainName: string;
  currentAuthority: number;
  targetAuthority: number;
  entityCount: number;
  publishedCount: number;
  convertingCount: number;
  averageGPS: number;
  averageAdvantage: number;
  orphanCount: number;
  topEntities: Array<{ name: string; gps: number; status: EntityStatus }>;
}

// ─────────────────────────────────────────────────────────────────
// OUTCOME KPI TYPES
// ─────────────────────────────────────────────────────────────────

export interface AtlasKPIs {
  subscribersAttributed: number;
  authorityDomainsWon: number;
  aiCitationsMonthly: number;
  topConvertingEntities: number;       // Entities with >5% CTR to YouTube
  entityToSubscriberRate: number;      // Percentage
  orphanRate: number;                  // Percentage
  productionOpportunities: number;
  averageDomainCoverage: number;       // Percentage of target authority achieved
  measuredAt: string;
}

// ─────────────────────────────────────────────────────────────────
// SEED ENTITY TYPE (for initial registry import)
// ─────────────────────────────────────────────────────────────────

export interface SeedEntity {
  entityType: EntityType;
  canonicalName: string;
  alternateNames: string[];
  region: string;
  language: string;
  tradition: string;
  searchIntent: string;

  // Scores
  seedAuthorityScore: number;
  connectionScore: number;
  authorityOpportunityScore: number;
  audienceCaptureScore: number;
  advantageScore: number;
  strategicGPS: number;
  discoveryReadinessScore: number;
  releaseConnectionStrength: number;

  // Advantage sub-scores
  contentGapScore: number;
  winProbability: number;
  competitionLevel: CompetitionLevel;

  // Action
  relatedSufiPulseAsset: string | null;
  recommendedAction: RecommendedAction;
  sufipulseJustification: string;

  // Domain
  primaryDomain: StrategicDomainId;
  secondaryDomain?: StrategicDomainId;

  // Provenance
  sourceReferences: string[];
  verificationStatus: VerificationStatus;

  notes?: string;
}
