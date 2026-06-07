/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Album
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Album extends BaseEntity {
  /** Album title */
  title: string;

  /** Release year */
  year: string;

  /** Record label or publisher */
  label: string;

  // ── Relationships ────────────────────────────────────────────────

  /** Songs on this album */
  songIds: string[];

  /** Singers/artists on this album */
  singerIds: string[];

  /** Regions associated with this album */
  regionIds: string[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this album */
  sourceIds: string[];

  /** Questions associated with this album */
  questionIds: string[];
}
