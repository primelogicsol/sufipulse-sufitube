/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Base Entity — Common fields for all entities
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

export type EntityStatus = 'draft' | 'review' | 'published' | 'archived';

export interface BaseEntity {
  /** Unique identifier (e.g., song_000001, singer_000001) */
  id: string;

  /** URL-safe identifier derived from name/title. Never used as primary key. */
  slug: string;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;

  /** Lifecycle status */
  status: EntityStatus;
}
