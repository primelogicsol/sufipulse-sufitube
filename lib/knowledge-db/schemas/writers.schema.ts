/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Writer
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Writer extends BaseEntity {
  /** Full name */
  name: string;

  /** Known alternate names, transliterations, or titles */
  alternateNames: string[];

  /** Biographical text */
  biography: string;

  /** Languages this writer composed in */
  languages: string[];

  /** Notable literary works */
  works: string[];

  /** Associated Sufi order (e.g., Chishti, Qadiri, Suhrawardi, Naqshbandi) */
  associatedOrder: string;

  // ── Relationships ────────────────────────────────────────────────

  /** Songs authored by this writer */
  songIds: string[];

  /** Concepts associated with this writer's works */
  conceptIds: string[];

  /** Regions associated with this writer */
  regionIds: string[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this writer */
  sourceIds: string[];

  /** Questions associated with this writer */
  questionIds: string[];
}
