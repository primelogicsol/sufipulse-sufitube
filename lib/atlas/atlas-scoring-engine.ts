/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS — Strategic GPS Scoring Engine
 * ═══════════════════════════════════════════════════════════════════
 *
 * Computes the 5-score system that drives all strategic decisions:
 *   1. Connection Score      × 0.20
 *   2. Authority Opportunity × 0.20
 *   3. Audience Capture      × 0.15
 *   4. Seed Authority        × 0.20
 *   5. Advantage Score       × 0.25  ← Highest weight
 *
 * The system answers: "What can SufiPulse WIN?"
 * Not merely: "What is popular?"
 * ═══════════════════════════════════════════════════════════════════
 */

import type {
  AtlasEntity,
  AtlasRelationship,
  GPSWeights,
  RecommendedAction,
  CompetitionLevel,
  ConversionEdgeType,
  CONVERSION_EDGE_TYPES,
  DEFAULT_GPS_WEIGHTS,
} from './atlas-types';

// ─────────────────────────────────────────────────────────────────
// GPS CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate the Strategic GPS score from the 5 component scores.
 * GPS = (connection × 0.20) + (authority × 0.20) + (capture × 0.15)
 *      + (seed × 0.20) + (advantage × 0.25)
 */
export function calculateStrategicGPS(
  connectionScore: number,
  authorityOpportunityScore: number,
  audienceCaptureScore: number,
  seedAuthorityScore: number,
  advantageScore: number,
  weights: GPSWeights = {
    connection: 0.20,
    authority: 0.20,
    capture: 0.15,
    seedAuthority: 0.20,
    advantage: 0.25,
  }
): number {
  const raw =
    clamp(connectionScore, 0, 100) * weights.connection +
    clamp(authorityOpportunityScore, 0, 100) * weights.authority +
    clamp(audienceCaptureScore, 0, 100) * weights.capture +
    clamp(seedAuthorityScore, 0, 100) * weights.seedAuthority +
    clamp(advantageScore, 0, 100) * weights.advantage;

  return Math.round(clamp(raw, 0, 100));
}

/**
 * Determine the recommended action based on GPS and conversion tier.
 */
export function determineRecommendedAction(
  strategicGPS: number,
  connectionScore: number,
  hopsToContent: number,
  hasRecommendedAsset: boolean
): RecommendedAction {
  // Score 0 = reject
  if (strategicGPS === 0) return 'reject';

  // No conversion path and low GPS = reference only
  if (hopsToContent > 3 && strategicGPS < 30) return 'referenceOnly';

  // Has an asset and high GPS = publish
  if (hasRecommendedAsset && strategicGPS >= 45 && connectionScore >= 15) return 'publish';

  // High GPS but no asset = production candidate
  if (strategicGPS >= 40 && !hasRecommendedAsset) return 'productionCandidate';

  // Medium GPS = defer
  if (strategicGPS >= 25) return 'defer';

  // Low GPS = reference only
  return 'referenceOnly';
}

/**
 * Determine the conversion tier based on hop distance.
 */
export function determineConversionTier(
  hopsToContent: number,
  strategicGPS: number
): 1 | 2 | 3 | 4 | 5 {
  if (hopsToContent === 0) return 1; // Entity IS SufiPulse content
  if (hopsToContent === 1) return 2; // 1 hop from SufiPulse content
  if (hopsToContent === 2) return 3; // 2 hops
  if (hopsToContent === 3 && strategicGPS >= 40) return 3; // 3 hops but high GPS
  if (hopsToContent === 3) return 4; // 3 hops, lower GPS
  return 5; // 4+ hops or no path = not connected
}

// ─────────────────────────────────────────────────────────────────
// ADVANTAGE SCORE CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate the Advantage Score from sub-components.
 * Advantage = (contentGap × 0.35) + (winProb × 0.30) + (domainFit × 0.20) + (competitionInv × 0.15)
 */
export function calculateAdvantageScore(
  contentGapScore: number,     // 0-35
  winProbability: number,      // 0-30
  domainFitScore: number,      // 0-20
  competitionInverse: number   // 0-15
): number {
  const raw = contentGapScore + winProbability + domainFitScore + competitionInverse;
  return Math.round(clamp(raw, 0, 100));
}

/**
 * Convert competition level to inverse score.
 */
export function competitionToInverse(level: CompetitionLevel): number {
  switch (level) {
    case 'none':      return 15;
    case 'weak':      return 12;
    case 'moderate':  return 8;
    case 'strong':    return 4;
    case 'dominant':  return 1;
    case 'unknown':   return 5;
    default:          return 5;
  }
}

// ─────────────────────────────────────────────────────────────────
// CONNECTION SCORE CALCULATION
// ─────────────────────────────────────────────────────────────────

export interface ConnectionScoreInputs {
  directReleaseCount: number;
  directVideoCount: number;
  directArticleCount: number;
  indirectPathHops: number;       // Minimum hops through related entities
  estimatedSearchVolume: number;  // Monthly search volume
  isInCoreTopicCluster: boolean;
}

/**
 * Calculate the Connection Score.
 * Measures how close this entity is to SufiPulse content.
 */
export function calculateConnectionScore(inputs: ConnectionScoreInputs): number {
  let score = 0;

  // Direct Release Links (0-30)
  if (inputs.directReleaseCount >= 3) score += 25;
  else if (inputs.directReleaseCount >= 1) score += 20;
  else score += 0;

  // Direct Video Links (0-20)
  if (inputs.directVideoCount >= 1) score += 20;
  else score += 0;

  // Direct Article Links (0-10)
  if (inputs.directArticleCount >= 1) score += 10;
  else score += 0;

  // Indirect Content Paths (0-15)
  if (inputs.indirectPathHops === 1) score += 15;
  else if (inputs.indirectPathHops === 2) score += 10;
  else if (inputs.indirectPathHops === 3) score += 5;
  else score += 0;

  // Conversion Potential (0-15)
  if (inputs.estimatedSearchVolume >= 100000) score += 15;
  else if (inputs.estimatedSearchVolume >= 50000) score += 12;
  else if (inputs.estimatedSearchVolume >= 20000) score += 10;
  else if (inputs.estimatedSearchVolume >= 5000) score += 7;
  else if (inputs.estimatedSearchVolume >= 1000) score += 4;
  else score += 2;

  // Authority Contribution (0-10)
  if (inputs.isInCoreTopicCluster) score += 10;
  else score += 3;

  return Math.round(clamp(score, 0, 100));
}

// ─────────────────────────────────────────────────────────────────
// FULL ENTITY SCORE RECALCULATION
// ─────────────────────────────────────────────────────────────────

export interface EntityScoreResult {
  connectionScore: number;
  authorityOpportunityScore: number;
  audienceCaptureScore: number;
  seedAuthorityScore: number;
  advantageScore: number;
  strategicGPS: number;
  conversionTier: 1 | 2 | 3 | 4 | 5;
  hopsToSufiPulseContent: number;
  recommendedAction: RecommendedAction;
}

/**
 * Recalculate all scores for an entity.
 * This is the main entry point for score recalculation.
 */
export function recalculateEntityScores(
  entity: AtlasEntity,
  connectionInputs: ConnectionScoreInputs,
  hopsToContent: number,
  hasRecommendedAsset: boolean
): EntityScoreResult {
  const connectionScore = calculateConnectionScore(connectionInputs);

  // Authority, Capture, Seed are typically set manually or from registry data
  // They don't change with graph structure (except authority which has flow component)
  const authorityOpportunityScore = entity.authorityOpportunityScore;
  const audienceCaptureScore = entity.audienceCaptureScore;
  const seedAuthorityScore = entity.seedAuthorityScore;
  const advantageScore = entity.advantageScore;

  const strategicGPS = calculateStrategicGPS(
    connectionScore,
    authorityOpportunityScore,
    audienceCaptureScore,
    seedAuthorityScore,
    advantageScore
  );

  const conversionTier = determineConversionTier(hopsToContent, strategicGPS);

  const recommendedAction = determineRecommendedAction(
    strategicGPS,
    connectionScore,
    hopsToContent,
    hasRecommendedAsset
  );

  return {
    connectionScore,
    authorityOpportunityScore,
    audienceCaptureScore,
    seedAuthorityScore,
    advantageScore,
    strategicGPS,
    conversionTier,
    hopsToSufiPulseContent: hopsToContent,
    recommendedAction,
  };
}

// ─────────────────────────────────────────────────────────────────
// PRODUCTION PRIORITY CALCULATION
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate production priority for a production candidate.
 * Higher = should be produced sooner.
 */
export function calculateProductionPriority(
  entitiesUnlocked: number,
  totalGPSUnlocked: number,
  averageCaptureScore: number,
  averageAdvantageScore: number
): number {
  return Math.round(
    (totalGPSUnlocked * 0.30) +
    (entitiesUnlocked * averageCaptureScore * 0.01 * 0.30) +
    (averageAdvantageScore * entitiesUnlocked * 0.01 * 0.40)
  );
}

// ─────────────────────────────────────────────────────────────────
// DISCOVERY READINESS SCORING
// ─────────────────────────────────────────────────────────────────

export interface DiscoveryReadinessInputs {
  entityCompleteness: number;    // 0-20
  relationshipDensity: number;   // 0-20
  conversionStrength: number;    // 0-20 
  contentQuality: number;        // 0-20
  authorityScore: number;        // 0-20
  releaseConnectionStrength: number; // Required. If 0, readiness cannot exceed 79.
}

/**
 * Calculate the Discovery Readiness Score.
 * Formula: Completeness + Relationship Density + Conversion Strength + Content Quality + Authority Score
 */
export function calculateDiscoveryReadinessScore(inputs: DiscoveryReadinessInputs): number {
  let raw = inputs.entityCompleteness 
          + inputs.relationshipDensity 
          + inputs.conversionStrength 
          + inputs.contentQuality 
          + inputs.authorityScore;
  
  if (inputs.releaseConnectionStrength === 0 && raw >= 80) {
    raw = 79; // Hard cap if no release connection exists
  }
  
  return Math.round(clamp(raw, 0, 100));
}

export interface FlagshipProtectionInputs {
  discoveryReadinessScore: number;
  strategicGPS: number;
  advantageScore: number;
  relationshipCount: number;
  relatedEntityCount: number;
  releaseCount: number;
  publicationCount: number;
  videoCount: number;
  conversionPathwayCount: number;
}

/**
 * Determine if an entity is ready for public discovery using Flagship Protection Rules
 */
export function determineDiscoveryStatus(inputs: FlagshipProtectionInputs): 'public' | 'review' | 'draft' {
  if (
    inputs.discoveryReadinessScore >= 80 &&
    inputs.strategicGPS >= 70 &&
    inputs.advantageScore >= 60 &&
    inputs.relationshipCount >= 5 &&
    inputs.relatedEntityCount >= 2 &&
    inputs.releaseCount >= 1 &&
    inputs.publicationCount >= 1 &&
    inputs.videoCount >= 1 &&
    inputs.conversionPathwayCount >= 1
  ) {
    return 'public';
  }
  
  if (inputs.discoveryReadinessScore >= 60) return 'review';
  return 'draft';
}

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
