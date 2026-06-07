/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Region
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Region extends BaseEntity {
  /** Region name (e.g., Punjab, Kashmir, Sindh, Anatolia) */
  name: string;

  /** Country or countries this region spans */
  country: string;

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this region entry */
  sourceIds: string[];

  /** Questions associated with this region */
  questionIds: string[];
}
