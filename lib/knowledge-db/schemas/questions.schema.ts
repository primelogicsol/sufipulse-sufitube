/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Question
 * Phase 1 — Core Data Model
 *
 * Questions are first-class database objects, not embedded text.
 * This architecture determines future AI discoverability.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

/** The type of entity a question is linked to */
export type LinkedEntityType =
  | 'song'
  | 'singer'
  | 'writer'
  | 'album'
  | 'concept'
  | 'language'
  | 'region';

export interface LinkedEntity {
  /** Entity type */
  entityType: LinkedEntityType;

  /** Entity ID */
  entityId: string;
}

export interface Question extends BaseEntity {
  /** The question text */
  question: string;

  /** The answer text */
  answer: string;

  /** Entities this question is linked to */
  linkedEntities: LinkedEntity[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify the answer */
  sourceIds: string[];
}
