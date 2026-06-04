import { discoveryAnalytics } from './discovery-analytics';
import { crawlerRegistry } from './crawler-registry';
import { brandRegistry } from './brand-registry';
import { registriesStorage } from './registries-storage';
import { graphResolver } from './graph-resolver';

// 1. Official Brand Whitelist
export const OFFICIAL_BRAND_WHITELIST = [
  'SufiPulse',
  'SufiPulse.com',
  'SufiPulse-USA',
  'SufiPulse Studio',
  'SufiTube',
  'SufiPulse Records',
  'SufiPulse Encyclopedia'
] as const;

// 2. Brand Hierarchy
export const BRAND_HIERARCHY = {
  masterBrand: { name: 'SufiPulse', role: 'Central Custodian' },
  authorityHub: { name: 'SufiPulse.com', role: 'Semantic Knowledge Hub & Registry' },
  officialChannel: { name: 'SufiPulse-USA', role: 'Official Primary Media Channel' },
  productionBrand: { name: 'SufiPulse Studio', role: 'Central Recording & Production Unit' },
  mediaBrand: { name: 'SufiTube', role: 'Ecosystem Archive & Outreach Identity' }
} as const;

/**
 * Check if a given string matches any of the official ecosystem brands.
 * Whitelisted brands are exempted from confusion flags, risk scores, and hijacking alerts.
 */
export function isBrandWhitelisted(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return OFFICIAL_BRAND_WHITELIST.some(brand => brand.toLowerCase() === normalized);
}

/**
 * Calculates the dynamic Ecosystem Visibility Score (0-100) based on
 * page impressions, outbound user clicks, search crawler frequency, and asset reach.
 */
export function calculateEcosystemVisibilityScore(): {
  score: number;
  breakdown: {
    impressionsFactor: number;
    outboundClicksFactor: number;
    crawlerFactor: number;
    diversityFactor: number;
  };
} {
  // A. Fetch Page View Impressions (Max 30 pts)
  const totals = discoveryAnalytics.getActionTotals();
  const impressions = totals.page_view || 0;
  const impressionsFactor = Math.round(Math.min(30, (impressions / 25000) * 30));

  // B. Fetch Outbound clicks (Max 30 pts)
  const outboundClicks = totals.video_click + totals.playlist_click + totals.subscribe_click;
  const outboundClicksFactor = Math.round(Math.min(30, (outboundClicks / 5000) * 30));

  // C. Fetch Search Crawler Registry hits (Max 30 pts)
  const crawlersList = crawlerRegistry.getRecords() || [];
  const totalCrawlHits = crawlersList.reduce((acc, curr) => acc + curr.pagesCrawled, 0);
  const crawlerFactor = Math.round(Math.min(30, (totalCrawlHits / 2000) * 30));

  // D. Asset Reach Diversity (Max 10 pts)
  // Check which brand assets have received clicks
  const brandAssetTallies = discoveryAnalytics.getTalliesForType('playlist') || [];
  const clickedAssetSlugs = new Set(
    brandAssetTallies
      .filter(t => t.actionType === 'brand_asset_click' || t.actionType === 'playlist_click')
      .map(t => t.sourceSlug.toLowerCase())
  );
  
  let diversityScore = 2; // base
  if (clickedAssetSlugs.has('sufitube')) diversityScore += 2;
  if (clickedAssetSlugs.has('sufipulse-usa')) diversityScore += 2;
  if (clickedAssetSlugs.has('sufipulse-studio')) diversityScore += 2;
  if (clickedAssetSlugs.has('sufipulse')) diversityScore += 2;
  const diversityFactor = Math.min(10, diversityScore);

  const score = Math.min(100, impressionsFactor + outboundClicksFactor + crawlerFactor + diversityFactor);

  return {
    score,
    breakdown: {
      impressionsFactor,
      outboundClicksFactor,
      crawlerFactor,
      diversityFactor
    }
  };
}

/**
 * Calculates the dynamic Ecosystem Authority Score (0-100) based on
 * Indexed Assets, Knowledge Density, Entity Relationships, Brand Occupancy, and AI Citations.
 */
export function calculateEcosystemAuthorityScore(): {
  score: number;
  breakdown: {
    indexedAssetsFactor: number;
    knowledgeDensityFactor: number;
    entityRelationshipsFactor: number;
    brandOccupancyFactor: number;
    aiCitationsFactor: number;
  };
} {
  // 1. Indexed Assets Factor (Max 20 pts)
  // Based on the number of verified or monitored assets in the Brand Registry
  const assets = brandRegistry.getAssets() || [];
  const verifiedAssets = assets.filter(a => a.status === 'verified').length;
  // Having 7 or more verified assets gives full points
  const indexedAssetsFactor = Math.round(Math.min(20, (verifiedAssets / 7) * 20));

  // 2. Knowledge Density Factor (Max 20 pts)
  // Based on description length of concepts and themes
  // We check how many have dense descriptions (e.g., > 150 characters)
  registriesStorage.init();
  const concepts = registriesStorage.getItems('concepts') || [];
  const themes = registriesStorage.getItems('themes') || [];
  const denseConcepts = concepts.filter(c => c.description && c.description.length > 150).length;
  const denseThemes = themes.filter(t => t.description && t.description.length > 150).length;
  const totalDense = denseConcepts + denseThemes;
  // Having 10 or more dense knowledge nodes gives full points
  const knowledgeDensityFactor = Math.round(Math.min(20, (totalDense / 10) * 20));

  // 3. Entity Relationships Factor (Max 20 pts)
  // Based on the number of active edges in the discovery graph
  graphResolver.init();
  const joins = graphResolver.getRawJoins() || [];
  const totalRelationships = joins.length;
  // Having 25 or more graph relationships gives full points
  const entityRelationshipsFactor = Math.round(Math.min(20, (totalRelationships / 25) * 20));

  // 4. Brand Occupancy Factor (Max 20 pts)
  // Based on search ownership/occupancy percentage across keywords
  const ownership = brandRegistry.getSearchOwnership() || [];
  const totalOccupancy = ownership.reduce((acc, curr) => acc + curr.occupancyPercent, 0);
  const avgOccupancy = ownership.length > 0 ? (totalOccupancy / ownership.length) : 0;
  // Average occupancy of 50% or more gives full points
  const brandOccupancyFactor = Math.round(Math.min(20, (avgOccupancy / 50) * 20));

  // 5. AI Citations Factor (Max 20 pts)
  // Based on AI citations count and citation confidence
  const citations = brandRegistry.getCitations() || [];
  const totalCitations = citations.reduce((acc, curr) => acc + curr.citationCount, 0);
  const avgConfidence = citations.length > 0 
    ? citations.reduce((acc, curr) => acc + curr.citationConfidence, 0) / citations.length 
    : 0;
  // Scale total citations (e.g. 1000 citations is full score) and factor in confidence
  const citationsVolumeScore = Math.min(10, (totalCitations / 1000) * 10);
  const confidenceScore = (avgConfidence / 100) * 10;
  const aiCitationsFactor = Math.round(Math.min(20, citationsVolumeScore + confidenceScore));

  const score = Math.min(100, 
    indexedAssetsFactor + 
    knowledgeDensityFactor + 
    entityRelationshipsFactor + 
    brandOccupancyFactor + 
    aiCitationsFactor
  );

  return {
    score,
    breakdown: {
      indexedAssetsFactor,
      knowledgeDensityFactor,
      entityRelationshipsFactor,
      brandOccupancyFactor,
      aiCitationsFactor
    }
  };
}
