/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS ENGINE — Entity Store
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
import type { AtlasEntityRecord } from '../database-schema';
import type { 
  AtlasEntity, 
  EntityType, 
  StrategicDomainId,
  EntityStatus,
} from './atlas-types';

export class AtlasEntityStore {
  private get table(): DatabaseTable<AtlasEntityRecord> {
    return db.table<AtlasEntityRecord>('atlas_entities');
  }

  /**
   * Create a new entity
   */
  public create(data: Omit<AtlasEntity, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): AtlasEntity {
    this.validateRequiredFields(data);

    if (data.strategicGPS === 0 && data.recommendedAction !== 'reject') {
      throw new Error(`[Foundational Rule Violation] Entity '${data.canonicalName}' has a Strategic GPS of 0. It serves no strategic goal and cannot be stored unless marked as 'reject'.`);
    }

    const now = new Date().toISOString();
    const entity: AtlasEntityRecord = {
      ...data,
      id: generateId(),
      slug: this.generateSlug(data.canonicalName),
      createdAt: now,
      updatedAt: now,
    };

    this.table.insert(entity);
    return entity;
  }

  /**
   * Update an existing entity
   */
  public update(id: string, updates: Partial<Omit<AtlasEntity, 'id' | 'createdAt' | 'updatedAt'>>): AtlasEntity | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedData = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    
    // Validations on update
    if (updates.canonicalName || updates.entityType || updates.primaryDomain || updates.sufipulseJustification !== undefined) {
      this.validateRequiredFields(updatedData);
    }

    if (updatedData.strategicGPS === 0 && updatedData.recommendedAction !== 'reject') {
        throw new Error(`[Foundational Rule Violation] Entity '${updatedData.canonicalName}' has a Strategic GPS of 0. It serves no strategic goal and cannot be updated unless marked as 'reject'.`);
    }

    if (updates.canonicalName && updates.canonicalName !== existing.canonicalName) {
      updatedData.slug = this.generateSlug(updates.canonicalName);
    }

    this.table.update(id, updatedData);
    return updatedData;
  }

  public findById(id: string): AtlasEntity | null {
    return this.table.findById(id) || null;
  }

  public findBySlug(slug: string): AtlasEntity | null {
    return this.table.findOne({ slug }) || null;
  }

  public findByType(type: EntityType): AtlasEntity[] {
    return this.table.find({ entityType: type });
  }

  public findByDomain(domainId: StrategicDomainId): AtlasEntity[] {
    const all = this.table.getAll();
    return all.filter(e => e.primaryDomain === domainId || e.secondaryDomain === domainId);
  }

  public findAll(): AtlasEntity[] {
    return this.table.getAll();
  }

  public search(query: string): AtlasEntity[] {
    const q = query.toLowerCase();
    return this.table.getAll().filter(e => 
      e.canonicalName.toLowerCase().includes(q) || 
      e.alternateNames.some(n => n.toLowerCase().includes(q))
    );
  }

  public delete(id: string): boolean {
    return this.table.delete(id);
  }

  public count(): number {
    return this.table.count();
  }

  // ── QUERY HELPERS ───────────────────────────────────────────────

  /**
   * Find all entities ready for publication based on strategic rules
   */
  public findPublishable(): AtlasEntity[] {
    return this.table.find({
      status: 'draft',
      isActive: true,
      connectionScore: { $gte: 15 },
      strategicGPS: { $gte: 45 },
      hopsToSufiPulseContent: { $lte: 3 }
    } as any); // Type cast due to custom operators in simple query interface
  }

  public findProductionCandidates(): AtlasEntity[] {
    return this.table.find({ recommendedAction: 'productionCandidate', isActive: true });
  }

  public findByAdvantage(minScore: number = 0): AtlasEntity[] {
    const entities = this.table.getAll().filter(e => e.advantageScore >= minScore && e.isActive);
    return entities.sort((a, b) => b.advantageScore - a.advantageScore);
  }

  public getOrphanCount(): number {
    // Entities with hops > 3 are considered orphans
    return this.table.getAll().filter(e => e.isActive && e.hopsToSufiPulseContent > 3).length;
  }

  public getDomainStats() {
    const stats = new Map<StrategicDomainId, { count: number; totalGPS: number }>();
    
    for (const e of this.table.getAll()) {
      if (!e.isActive) continue;
      
      const domain = e.primaryDomain;
      const current = stats.get(domain) || { count: 0, totalGPS: 0 };
      current.count++;
      current.totalGPS += e.strategicGPS;
      stats.set(domain, current);
    }
    
    const result: Record<string, { count: number; avgGPS: number }> = {};
    for (const [domain, data] of stats.entries()) {
      result[domain] = {
        count: data.count,
        avgGPS: data.count > 0 ? Math.round(data.totalGPS / data.count) : 0
      };
    }
    
    return result;
  }

  // ── UTILITIES ───────────────────────────────────────────────────

  private validateRequiredFields(data: Partial<AtlasEntity>) {
    if (!data.canonicalName?.trim()) throw new Error("canonicalName is required");
    if (!data.entityType) throw new Error("entityType is required");
    if (!data.primaryDomain) throw new Error("primaryDomain is required");
    if (!data.sufipulseJustification?.trim()) throw new Error("sufipulseJustification is required");
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric to hyphen
      .replace(/^-+|-+$/g, ''); // trim hyphens
  }
}

// Export singleton
export const entityStore = new AtlasEntityStore();
