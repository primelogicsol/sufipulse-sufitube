/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Source
 * Phase 1 — Core Data Model
 *
 * Every factual field must support sourceIds[].
 * Authority depends on traceability.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

/** Classification of the source material */
export type SourceType =
  | 'book'
  | 'academic_paper'
  | 'article'
  | 'website'
  | 'encyclopedia'
  | 'oral_tradition'
  | 'archival_record'
  | 'documentary'
  | 'interview';

export interface Source extends BaseEntity {
  /** Title of the source material */
  title: string;

  /** Author or contributor */
  author: string;

  /** Type of source */
  type: SourceType;

  /** URL if available */
  url: string;

  /** Publisher or issuing institution */
  publisher: string;

  /** Year of publication */
  year: string;

  /** Formatted citation string */
  citation: string;
}
