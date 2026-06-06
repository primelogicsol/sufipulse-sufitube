/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS — Graph Engine
 * ═══════════════════════════════════════════════════════════════════
 *
 * Handles graph traversal, path finding, conversion path analysis,
 * orphan detection, and the production queue.
 *
 * For Phase 2A (200 entities, ~2500 edges), this runs entirely
 * in-memory using adjacency lists built from the database.
 * ═══════════════════════════════════════════════════════════════════
 */

import type {
  AtlasEntity,
  AtlasRelationship,
  ConversionPath,
  ProductionCandidate,
  OrphanEntity,
  RelationshipFamily,
  EntityType,
  StrategicDomainId,
} from './atlas-types';
import { AUTHORITY_FLOW_WEIGHTS } from './atlas-types';

// ─────────────────────────────────────────────────────────────────
// IN-MEMORY GRAPH STRUCTURE
// ─────────────────────────────────────────────────────────────────

/** Content relationship types that connect to SufiPulse content */
const CONTENT_EDGE_TYPES = new Set([
  'featured_in_release', 'credited_in_release', 'tagged_in_release',
  'discussed_in_article', 'included_in_playlist',
]);

/** Adjacency list representation of the graph */
export interface GraphIndex {
  /** Map of entity ID → all outgoing edges */
  outgoing: Map<string, AtlasRelationship[]>;
  /** Map of entity ID → all incoming edges */
  incoming: Map<string, AtlasRelationship[]>;
  /** Map of entity ID → entity data */
  entities: Map<string, AtlasEntity>;
}

/**
 * Build an in-memory graph index from entities and relationships.
 * For Phase 2A (200 entities) this is fast and efficient.
 */
export function buildGraphIndex(
  entities: AtlasEntity[],
  relationships: AtlasRelationship[]
): GraphIndex {
  const outgoing = new Map<string, AtlasRelationship[]>();
  const incoming = new Map<string, AtlasRelationship[]>();
  const entityMap = new Map<string, AtlasEntity>();

  for (const entity of entities) {
    entityMap.set(entity.id, entity);
    outgoing.set(entity.id, []);
    incoming.set(entity.id, []);
  }

  for (const rel of relationships) {
    const outList = outgoing.get(rel.sourceEntityId);
    if (outList) outList.push(rel);

    const inList = incoming.get(rel.targetEntityId);
    if (inList) inList.push(rel);
  }

  return { outgoing, incoming, entities: entityMap };
}

// ─────────────────────────────────────────────────────────────────
// HOP DISTANCE CALCULATION (BFS)
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate minimum hops from an entity to the nearest SufiPulse content.
 * Uses BFS with a max depth of 3 (the enforced maximum).
 * 
 * Returns:
 *   0 = Entity IS SufiPulse content (release with video)
 *   1 = Directly connected to SufiPulse content
 *   2 = One intermediate entity
 *   3 = Two intermediaries (maximum allowed)
 *   Infinity = No path found (ORPHANED)
 */
export function calculateHopsToContent(
  entityId: string,
  graph: GraphIndex
): number {
  const entity = graph.entities.get(entityId);
  if (!entity) return Infinity;

  // Hop 0: Entity IS SufiPulse content
  if (entity.entityType === 'release' && (entity.connectedVideoIds || []).length > 0) {
    return 0;
  }

  // BFS with max depth 3
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: entityId, depth: 0 }];
  visited.add(entityId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    if (depth > 3) break; // Enforce 3-hop maximum

    // Check if this entity has a direct content edge
    const edges = graph.outgoing.get(id) || [];
    for (const edge of edges) {
      if (CONTENT_EDGE_TYPES.has(edge.relationshipType)) {
        // Found a content connection at this depth
        return depth + 1;
      }
    }

    // If we haven't exceeded max depth, expand neighbors
    if (depth < 3) {
      for (const edge of edges) {
        if (!visited.has(edge.targetEntityId)) {
          visited.add(edge.targetEntityId);
          queue.push({ id: edge.targetEntityId, depth: depth + 1 });
        }
      }
      // Also check incoming edges (bidirectional traversal)
      const inEdges = graph.incoming.get(id) || [];
      for (const edge of inEdges) {
        if (!visited.has(edge.sourceEntityId)) {
          visited.add(edge.sourceEntityId);
          queue.push({ id: edge.sourceEntityId, depth: depth + 1 });
        }
      }
    }
  }

  return Infinity; // No path found — entity is orphaned
}

/**
 * Find the full conversion path from an entity to SufiPulse content.
 */
export function findConversionPath(
  entityId: string,
  graph: GraphIndex
): ConversionPath | null {
  const entity = graph.entities.get(entityId);
  if (!entity) return null;

  // BFS tracking full paths
  const visited = new Set<string>();
  const queue: Array<{ id: string; path: string[] }> = [
    { id: entityId, path: [entityId] },
  ];
  visited.add(entityId);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    if (path.length > 4) continue; // Max 3 hops = 4 nodes in path

    const edges = graph.outgoing.get(id) || [];
    for (const edge of edges) {
      if (CONTENT_EDGE_TYPES.has(edge.relationshipType)) {
        const targetEntity = graph.entities.get(edge.targetEntityId);
        return {
          entityId,
          hops: path.length, // path.length = number of edges traversed
          path: [...path, edge.targetEntityId],
          terminalAssetType: targetEntity?.entityType === 'release'
            ? 'release'
            : targetEntity?.entityType === 'publication'
              ? 'article'
              : 'playlist',
          terminalAssetId: edge.targetEntityId,
          hasYouTubeVideo: targetEntity?.connectedVideoIds?.length
            ? targetEntity.connectedVideoIds.length > 0
            : false,
        };
      }
    }

    // Expand neighbors
    if (path.length < 4) {
      for (const edge of edges) {
        if (!visited.has(edge.targetEntityId)) {
          visited.add(edge.targetEntityId);
          queue.push({ id: edge.targetEntityId, path: [...path, edge.targetEntityId] });
        }
      }
      const inEdges = graph.incoming.get(id) || [];
      for (const edge of inEdges) {
        if (!visited.has(edge.sourceEntityId)) {
          visited.add(edge.sourceEntityId);
          queue.push({ id: edge.sourceEntityId, path: [...path, edge.sourceEntityId] });
        }
      }
    }
  }

  return null; // No conversion path
}

// ─────────────────────────────────────────────────────────────────
// ORPHAN DETECTION
// ─────────────────────────────────────────────────────────────────

/**
 * Find all orphaned entities — entities with no conversion path
 * to SufiPulse content within 3 hops.
 */
export function findOrphans(graph: GraphIndex): OrphanEntity[] {
  const orphans: OrphanEntity[] = [];

  for (const [id, entity] of graph.entities) {
    if (!entity.isActive) continue;

    const hops = calculateHopsToContent(id, graph);
    if (hops > 3) {
      orphans.push({
        entityId: id,
        entityName: entity.canonicalName,
        entityType: entity.entityType,
        strategicGPS: entity.strategicGPS,
        advantageScore: entity.advantageScore,
        primaryDomain: entity.primaryDomain,
        nearestContentHops: hops === Infinity ? null : hops,
      });
    }
  }

  return orphans.sort((a, b) => b.strategicGPS - a.strategicGPS);
}

// ─────────────────────────────────────────────────────────────────
// PRODUCTION QUEUE
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate the production queue — what should SufiPulse produce next?
 * 
 * For each production candidate, calculate how many draft/orphaned entities
 * would become publishable if this content were produced.
 */
export function calculateProductionQueue(
  graph: GraphIndex
): ProductionCandidate[] {
  const candidates: ProductionCandidate[] = [];

  for (const [id, entity] of graph.entities) {
    if (entity.recommendedAsset?.assetType !== 'production_candidate') continue;

    // Find all entities connected to this one that are currently draft/orphaned
    const unlockable: AtlasEntity[] = [];
    const connectedIds = new Set<string>();

    // Gather 1-hop and 2-hop connections
    const directEdges = [
      ...(graph.outgoing.get(id) || []),
      ...(graph.incoming.get(id) || []),
    ];

    for (const edge of directEdges) {
      const neighborId = edge.sourceEntityId === id ? edge.targetEntityId : edge.sourceEntityId;
      if (connectedIds.has(neighborId)) continue;
      connectedIds.add(neighborId);

      const neighbor = graph.entities.get(neighborId);
      if (neighbor && (neighbor.status === 'draft' || neighbor.hopsToSufiPulseContent > 3)) {
        unlockable.push(neighbor);
      }

      // Also check 2-hop connections
      const secondEdges = [
        ...(graph.outgoing.get(neighborId) || []),
        ...(graph.incoming.get(neighborId) || []),
      ];
      for (const secondEdge of secondEdges) {
        const secondId = secondEdge.sourceEntityId === neighborId
          ? secondEdge.targetEntityId
          : secondEdge.sourceEntityId;
        if (connectedIds.has(secondId) || secondId === id) continue;
        connectedIds.add(secondId);

        const secondNeighbor = graph.entities.get(secondId);
        if (secondNeighbor && (secondNeighbor.status === 'draft' || secondNeighbor.hopsToSufiPulseContent > 3)) {
          unlockable.push(secondNeighbor);
        }
      }
    }

    if (unlockable.length === 0) continue;

    const totalGPSUnlocked = unlockable.reduce((sum, e) => sum + e.strategicGPS, 0);
    const avgCapture = unlockable.reduce((sum, e) => sum + e.audienceCaptureScore, 0) / unlockable.length;
    const avgAdvantage = unlockable.reduce((sum, e) => sum + e.advantageScore, 0) / unlockable.length;

    candidates.push({
      entityId: id,
      entityName: entity.canonicalName,
      productionNotes: entity.recommendedAsset?.productionNotes || '',
      entitiesUnlocked: unlockable.length,
      totalGPSUnlocked,
      primaryDomain: entity.primaryDomain,
      productionPriority: Math.round(
        (totalGPSUnlocked * 0.30) +
        (unlockable.length * avgCapture * 0.01 * 0.30) +
        (avgAdvantage * unlockable.length * 0.01 * 0.40)
      ),
    });
  }

  return candidates.sort((a, b) => b.productionPriority - a.productionPriority);
}

// ─────────────────────────────────────────────────────────────────
// AUTHORITY FLOW
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate authority flow for an entity based on its graph connections.
 * Authority flows from well-connected entities through edges.
 */
export function calculateAuthorityFlow(
  entityId: string,
  graph: GraphIndex
): number {
  const entity = graph.entities.get(entityId);
  if (!entity) return 0;

  const baseAuthority = entity.authorityOpportunityScore;
  let inheritedAuthority = 0;

  // Incoming edges contribute authority
  const incomingEdges = graph.incoming.get(entityId) || [];
  for (const edge of incomingEdges) {
    const sourceEntity = graph.entities.get(edge.sourceEntityId);
    if (!sourceEntity) continue;

    const flowWeight = edge.authorityFlowWeight || AUTHORITY_FLOW_WEIGHTS[edge.family] || 0.2;
    inheritedAuthority += sourceEntity.authorityOpportunityScore * flowWeight * 0.15;
  }

  // Outgoing edges also contribute (bidirectional authority)
  const outgoingEdges = graph.outgoing.get(entityId) || [];
  for (const edge of outgoingEdges) {
    const targetEntity = graph.entities.get(edge.targetEntityId);
    if (!targetEntity) continue;

    const flowWeight = edge.authorityFlowWeight || AUTHORITY_FLOW_WEIGHTS[edge.family] || 0.2;
    inheritedAuthority += targetEntity.authorityOpportunityScore * flowWeight * 0.10;
  }

  return Math.min(100, Math.round(baseAuthority + inheritedAuthority));
}

// ─────────────────────────────────────────────────────────────────
// GRAPH STATISTICS
// ─────────────────────────────────────────────────────────────────

export interface GraphStats {
  totalEntities: number;
  publishedEntities: number;
  totalEdges: number;
  averageGPS: number;
  averageAdvantage: number;
  averageHops: number;
  orphanCount: number;
  orphanRate: number;
  convertingEntities: number;
  domainCoverage: Map<string, { count: number; published: number; avgGPS: number }>;
  edgesPerEntity: number;
}

/**
 * Calculate comprehensive graph statistics.
 */
export function calculateGraphStats(
  graph: GraphIndex,
  relationships: AtlasRelationship[]
): GraphStats {
  const entities = Array.from(graph.entities.values()).filter(e => e.isActive);
  const published = entities.filter(e => e.status === 'published');

  let totalGPS = 0;
  let totalAdvantage = 0;
  let totalHops = 0;
  let orphanCount = 0;
  let hopsCount = 0;

  const domainMap = new Map<string, { count: number; published: number; totalGPS: number }>();

  for (const entity of entities) {
    totalGPS += entity.strategicGPS;
    totalAdvantage += entity.advantageScore;

    const hops = calculateHopsToContent(entity.id, graph);
    if (hops !== Infinity) {
      totalHops += hops;
      hopsCount++;
    } else {
      orphanCount++;
    }

    // Domain stats
    const domain = entity.primaryDomain;
    if (domain) {
      const existing = domainMap.get(domain) || { count: 0, published: 0, totalGPS: 0 };
      existing.count++;
      if (entity.status === 'published') existing.published++;
      existing.totalGPS += entity.strategicGPS;
      domainMap.set(domain, existing);
    }
  }

  const domainCoverage = new Map<string, { count: number; published: number; avgGPS: number }>();
  for (const [domain, stats] of domainMap) {
    domainCoverage.set(domain, {
      count: stats.count,
      published: stats.published,
      avgGPS: stats.count > 0 ? Math.round(stats.totalGPS / stats.count) : 0,
    });
  }

  return {
    totalEntities: entities.length,
    publishedEntities: published.length,
    totalEdges: relationships.length,
    averageGPS: entities.length > 0 ? Math.round(totalGPS / entities.length) : 0,
    averageAdvantage: entities.length > 0 ? Math.round(totalAdvantage / entities.length) : 0,
    averageHops: hopsCount > 0 ? parseFloat((totalHops / hopsCount).toFixed(1)) : 0,
    orphanCount,
    orphanRate: entities.length > 0 ? parseFloat(((orphanCount / entities.length) * 100).toFixed(1)) : 0,
    convertingEntities: entities.filter(e => (e.connectedVideoIds || []).length > 0).length,
    domainCoverage,
    edgesPerEntity: entities.length > 0 ? parseFloat((relationships.length / entities.length).toFixed(1)) : 0,
  };
}
