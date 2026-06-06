/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS ENGINE — Relationship Store
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

import { db, generateId } from '../database';
import type { DatabaseTable } from '../database';
import type { AtlasRelationshipRecord } from '../database-schema';
import { entityStore } from './atlas-entity';
import {
  RELATIONSHIP_CONSTRAINTS,
  AUTHORITY_FLOW_WEIGHTS,
  MUSICAL_RELATIONSHIPS,
  LITERARY_RELATIONSHIPS,
  SPIRITUAL_RELATIONSHIPS,
  GEOGRAPHIC_RELATIONSHIPS,
  CONTENT_RELATIONSHIPS,
  META_RELATIONSHIPS,
  CONVERSION_EDGE_TYPES,
} from './atlas-types';
import type { 
  AtlasRelationship, 
  RelationshipType, 
  RelationshipFamily,
  EntityType,
} from './atlas-types';

export class AtlasRelationshipStore {
  private get table(): DatabaseTable<AtlasRelationshipRecord> {
    return db.table<AtlasRelationshipRecord>('atlas_relationships');
  }

  /**
   * Create a new relationship (edge) between two entities
   */
  public create(data: Omit<AtlasRelationship, 'id' | 'family' | 'authorityFlowWeight' | 'createsConversionPath' | 'createdAt' | 'updatedAt'>): AtlasRelationship {
    this.validateRelationship(data.sourceEntityId, data.targetEntityId, data.relationshipType);

    const family = this.determineFamily(data.relationshipType);
    const authorityFlowWeight = AUTHORITY_FLOW_WEIGHTS[family];
    // Cast to any to check if it's a content edge type. Set createsConversionPath to true if it is.
    const createsConversionPath = (CONVERSION_EDGE_TYPES as readonly string[]).includes(data.relationshipType);

    const now = new Date().toISOString();
    const relationship: AtlasRelationshipRecord = {
      ...data,
      id: generateId(),
      family,
      authorityFlowWeight,
      createsConversionPath,
      createdAt: now,
      updatedAt: now,
    };

    this.table.insert(relationship);
    return relationship;
  }

  /**
   * Update an existing relationship
   */
  public update(id: string, updates: Partial<Omit<AtlasRelationship, 'id' | 'createdAt' | 'updatedAt'>>): AtlasRelationship | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedData = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    // If source, target, or type changed, re-validate
    if (updates.sourceEntityId || updates.targetEntityId || updates.relationshipType) {
      this.validateRelationship(updatedData.sourceEntityId, updatedData.targetEntityId, updatedData.relationshipType);
    }

    // Recalculate derived fields if type changed
    if (updates.relationshipType) {
      updatedData.family = this.determineFamily(updatedData.relationshipType);
      updatedData.authorityFlowWeight = AUTHORITY_FLOW_WEIGHTS[updatedData.family];
      updatedData.createsConversionPath = (CONVERSION_EDGE_TYPES as readonly string[]).includes(updatedData.relationshipType);
    }

    this.table.update(id, updatedData);
    return updatedData;
  }

  public findById(id: string): AtlasRelationship | null {
    return this.table.findById(id) || null;
  }

  public findBySource(sourceId: string): AtlasRelationship[] {
    return this.table.find({ sourceEntityId: sourceId });
  }

  public findByTarget(targetId: string): AtlasRelationship[] {
    return this.table.find({ targetEntityId: targetId });
  }

  public findByType(type: RelationshipType): AtlasRelationship[] {
    return this.table.find({ relationshipType: type });
  }

  public findAll(): AtlasRelationship[] {
    return this.table.getAll();
  }

  public delete(id: string): boolean {
    return this.table.delete(id);
  }

  public count(): number {
    return this.table.count();
  }

  // ── QUERY HELPERS ───────────────────────────────────────────────

  public findEdgesBetween(entityAId: string, entityBId: string): AtlasRelationship[] {
    return this.table.getAll().filter(r => 
      (r.sourceEntityId === entityAId && r.targetEntityId === entityBId) ||
      (r.sourceEntityId === entityBId && r.targetEntityId === entityAId)
    );
  }

  public getEntityEdgeCount(entityId: string): number {
    return this.findBySource(entityId).length + this.findByTarget(entityId).length;
  }

  public findConversionEdges(): AtlasRelationship[] {
    return this.table.find({ createsConversionPath: true });
  }

  // ── VALIDATION & UTILITIES ──────────────────────────────────────

  private validateRelationship(sourceId: string, targetId: string, type: RelationshipType) {
    if (!sourceId) throw new Error("sourceEntityId is required");
    if (!targetId) throw new Error("targetEntityId is required");
    if (!type) throw new Error("relationshipType is required");

    // 1. No self-references (except bidirectional 'related_to')
    if (sourceId === targetId && type !== 'related_to') {
      throw new Error(`Self-references are not allowed for relationship type '${type}'`);
    }

    // 2. No duplicate edges
    const existing = this.table.find({
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationshipType: type
    });
    if (existing.length > 0) {
      throw new Error(`Relationship '${type}' already exists between ${sourceId} and ${targetId}`);
    }

    // 3. Entity Type Constraints
    const sourceEntity = entityStore.findById(sourceId);
    if (!sourceEntity) throw new Error(`Source entity not found: ${sourceId}`);
    
    const targetEntity = entityStore.findById(targetId);
    if (!targetEntity) throw new Error(`Target entity not found: ${targetId}`);

    const constraint = RELATIONSHIP_CONSTRAINTS[type as string];
    if (constraint) {
      if (!constraint.sources.includes(sourceEntity.entityType as EntityType)) {
        throw new Error(`Invalid source entity type '${sourceEntity.entityType}' for relationship '${type}'. Allowed: ${constraint.sources.join(', ')}`);
      }
      if (!constraint.targets.includes(targetEntity.entityType as EntityType)) {
        throw new Error(`Invalid target entity type '${targetEntity.entityType}' for relationship '${type}'. Allowed: ${constraint.targets.join(', ')}`);
      }
    }
  }

  private determineFamily(type: RelationshipType): RelationshipFamily {
    if ((MUSICAL_RELATIONSHIPS as readonly string[]).includes(type)) return 'musical';
    if ((LITERARY_RELATIONSHIPS as readonly string[]).includes(type)) return 'literary';
    if ((SPIRITUAL_RELATIONSHIPS as readonly string[]).includes(type)) return 'spiritual';
    if ((GEOGRAPHIC_RELATIONSHIPS as readonly string[]).includes(type)) return 'geographic';
    if ((CONTENT_RELATIONSHIPS as readonly string[]).includes(type)) return 'content';
    return 'meta';
  }
}

// Export singleton
export const relationshipStore = new AtlasRelationshipStore();
