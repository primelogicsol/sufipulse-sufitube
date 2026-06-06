/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS ENGINE — Barrel Export
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

// Types
export type {
  EntityType,
  EntityStatus,
  VerificationStatus,
  AtlasEntity,
  RelationshipFamily,
  RelationshipType,
  AtlasRelationship,
  StrategicDomainId,
  StrategicDomain,
  CompetitionLevel,
  RecommendedAction,
  RecommendedAsset,
  GPSWeights,
  ConversionPath,
  ProductionCandidate,
  OrphanEntity,
  DomainReport,
  AtlasKPIs,
  SeedEntity,
} from './atlas-types';

// Constants
export {
  ENTITY_TYPES,
  ENTITY_STATUS,
  VERIFICATION_STATUS,
  RELATIONSHIP_FAMILIES,
  MUSICAL_RELATIONSHIPS,
  LITERARY_RELATIONSHIPS,
  SPIRITUAL_RELATIONSHIPS,
  GEOGRAPHIC_RELATIONSHIPS,
  CONTENT_RELATIONSHIPS,
  META_RELATIONSHIPS,
  ALL_RELATIONSHIPS,
  RELATIONSHIP_CONSTRAINTS,
  AUTHORITY_FLOW_WEIGHTS,
  STRATEGIC_DOMAIN_IDS,
  DEFAULT_GPS_WEIGHTS,
  CONVERSION_EDGE_TYPES,
} from './atlas-types';

// Scoring Engine
export {
  calculateStrategicGPS,
  determineRecommendedAction,
  determineConversionTier,
  calculateAdvantageScore,
  competitionToInverse,
  calculateConnectionScore,
  recalculateEntityScores,
  calculateProductionPriority,
} from './atlas-scoring-engine';

// Graph Engine
export {
  buildGraphIndex,
  calculateHopsToContent,
  findConversionPath,
  findOrphans,
  calculateProductionQueue,
  calculateAuthorityFlow,
  calculateGraphStats,
} from './atlas-graph-engine';
export type { GraphIndex, GraphStats } from './atlas-graph-engine';
export type { ConnectionScoreInputs, EntityScoreResult } from './atlas-scoring-engine';

// Strategic Domains
export { STRATEGIC_DOMAINS } from './atlas-strategic-domains';
