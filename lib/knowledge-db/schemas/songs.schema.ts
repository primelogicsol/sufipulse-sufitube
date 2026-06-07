/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Entity: Song
 * Phase 1 — Core Data Model
 * ═══════════════════════════════════════════════════════════════════
 */

import type { BaseEntity } from './base.schema';

export interface Song extends BaseEntity {
  /** Primary title */
  title: string;

  /** Known alternate titles, transliterations, or regional variants */
  alternateTitles: string[];

  /** Brief factual summary of the song */
  summary: string;

  /** Full lyrics text */
  lyrics: string;

  /** Explanation or interpretation of the lyrics */
  meaning: string;

  /** Genre classification (e.g., Qawwali, Kafi, Ghazal, Hamd, Naat) */
  genre: string;

  /** Historical era or approximate period of composition */
  era: string;

  /** Attribution status for writer identification */
  attributionStatus: 'attributed' | 'traditional' | 'disputed' | 'unknown';

  /** Classification of composition type */
  compositionType: 'performed' | 'literary' | 'liturgical';

  // ── Relationships ────────────────────────────────────────────────

  /** Writers who authored this song */
  writerIds: string[];

  /** Singers who have performed this song */
  singerIds: string[];

  /** Albums this song appears on */
  albumIds: string[];

  /** Sufi concepts expressed in this song */
  conceptIds: string[];

  /** Languages this song is written/performed in */
  languageIds: string[];

  /** Regions associated with this song */
  regionIds: string[];

  // ── Authority ────────────────────────────────────────────────────

  /** Sources that verify facts about this song */
  sourceIds: string[];

  /** Questions associated with this song */
  questionIds: string[];
}
