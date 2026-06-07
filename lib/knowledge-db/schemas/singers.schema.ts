/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Singer
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Singer extends BaseEntity {
  /** Full name */
  name: string;

  /** Known alternate names, transliterations, or titles */
  alternateNames: string[];

  /** Biographical text */
  biography: string;

  /** Country of origin or primary association */
  country: string;

  /** Birth date or approximate period */
  birth: string;

  /** Death date or approximate period (empty string if living) */
  death: string;

  // ── Relationships ────────────────────────────────────────────────

  /** Languages this singer performs in */
  languageIds: string[];

  /** Songs performed by this singer */
  songIds: string[];

  /** Albums this singer appears on */
  albumIds: string[];

  /** Regions associated with this singer */
  regionIds: string[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this singer */
  sourceIds: string[];

  /** Questions associated with this singer */
  questionIds: string[];
}
