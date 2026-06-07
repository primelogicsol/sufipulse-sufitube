/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Language
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Language extends BaseEntity {
  /** Language name in English (e.g., Urdu, Punjabi, Persian) */
  name: string;

  /** Language name in its own script (e.g., اردو, ਪੰਜਾਬੀ, فارسی) */
  nativeName: string;

  /** ISO 639 language code (e.g., ur, pa, fa) */
  isoCode: string;

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this language entry */
  sourceIds: string[];

  /** Questions associated with this language */
  questionIds: string[];
}
