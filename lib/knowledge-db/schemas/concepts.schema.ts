/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Concept
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Concept extends BaseEntity {
  /** Concept name (e.g., Ishq, Fana, Sama, Dhikr) */
  name: string;

  /** Factual definition of this concept */
  definition: string;

  // ── Relationships ────────────────────────────────────────────────

  /** Songs that express or reference this concept */
  relatedSongIds: string[];

  /** Writers whose works engage with this concept */
  relatedWriterIds: string[];

  /** Saints associated with this concept */
  relatedSaintIds: string[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this concept */
  sourceIds: string[];

  /** Questions associated with this concept */
  questionIds: string[];
}
