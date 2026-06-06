/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE ATLAS ENGINE — Domain Store
 * ═══════════════════════════════════════════════════════════════════
 */

import { db } from '../database';
import type { DatabaseTable } from '../database';
import type { AtlasStrategicDomainRecord } from '../database-schema';
import type { StrategicDomain, StrategicDomainId } from './atlas-types';
import { STRATEGIC_DOMAINS } from './atlas-strategic-domains';

export class AtlasDomainStore {
  private get table(): DatabaseTable<AtlasStrategicDomainRecord> {
    return db.table<AtlasStrategicDomainRecord>('atlas_strategic_domains');
  }

  public seedInitialDomains() {
    // Only seed if empty
    if (this.table.count() === 0) {
      for (const domain of STRATEGIC_DOMAINS) {
        this.table.insert({
          ...domain,
          // Since the ID is statically defined as a constant string, we'll use that string
          // directly as the ID in the file database too.
        });
      }
      console.log(`[Atlas] Seeded ${STRATEGIC_DOMAINS.length} strategic domains.`);
    }
  }

  public findAll(): StrategicDomain[] {
    return this.table.getAll();
  }

  public findById(id: StrategicDomainId): StrategicDomain | null {
    return this.table.findById(id) || null;
  }

  public update(id: StrategicDomainId, updates: Partial<StrategicDomain>): StrategicDomain | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedData = { ...existing, ...updates };
    this.table.update(id, updatedData as AtlasStrategicDomainRecord);
    return updatedData;
  }
}

export const domainStore = new AtlasDomainStore();
