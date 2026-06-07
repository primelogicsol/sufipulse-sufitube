/**
 * ═══════════════════════════════════════════════════════════════════
 * SUFIPULSE KNOWLEDGE AUTHORITY DATABASE
 * Relationship Definitions
 * Phase 1 — Core Data Model
 *
 * Definitions only. No implementation.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * RELATIONSHIP MAP
 *
 * Song
 *  ├── Writers      (writerIds)
 *  ├── Singers      (singerIds)
 *  ├── Albums       (albumIds)
 *  ├── Concepts     (conceptIds)
 *  ├── Languages    (languageIds)
 *  ├── Regions      (regionIds)
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Singer
 *  ├── Songs        (songIds)
 *  ├── Albums       (albumIds)
 *  ├── Languages    (languageIds)
 *  ├── Regions      (regionIds)
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Writer
 *  ├── Songs        (songIds)
 *  ├── Concepts     (conceptIds)
 *  ├── Regions      (regionIds)
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Album
 *  ├── Songs        (songIds)
 *  ├── Singers      (singerIds)
 *  ├── Regions      (regionIds)
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Concept
 *  ├── Songs        (relatedSongIds)
 *  ├── Writers      (relatedWriterIds)
 *  ├── Saints       (relatedSaintIds)
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Language
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Region
 *  ├── Sources      (sourceIds)
 *  └── Questions    (questionIds)
 *
 * Question
 *  ├── Linked Entities (linkedEntities[])
 *  └── Sources         (sourceIds)
 *
 * Source
 *  (terminal node — referenced by all other entities)
 */

/**
 * EXAMPLE RELATIONSHIP CHAIN
 *
 * Chaap Tilak (Song)
 *  └── Amir Khusrau (Writer)
 *       └── Qawwali (Concept)
 *            └── Ishq (Concept)
 *                 └── Chishti Tradition (Concept)
 *                      └── Delhi / South Asia (Region)
 */

/** All entity types in the knowledge database */
export type EntityType =
  | 'song'
  | 'singer'
  | 'writer'
  | 'album'
  | 'concept'
  | 'language'
  | 'region'
  | 'question'
  | 'source';

/** Defines a directional relationship between two entity types */
export interface RelationshipDefinition {
  /** The entity type that holds the reference */
  from: EntityType;

  /** The entity type being referenced */
  to: EntityType;

  /** The field name on the source entity that stores the target IDs */
  field: string;

  /** Human-readable description of the relationship */
  description: string;
}

/** Complete list of all relationships in the knowledge database */
export const RELATIONSHIP_DEFINITIONS: RelationshipDefinition[] = [
  // Song relationships
  { from: 'song', to: 'writer',   field: 'writerIds',   description: 'Writers who authored this song' },
  { from: 'song', to: 'singer',   field: 'singerIds',   description: 'Singers who performed this song' },
  { from: 'song', to: 'album',    field: 'albumIds',    description: 'Albums this song appears on' },
  { from: 'song', to: 'concept',  field: 'conceptIds',  description: 'Concepts expressed in this song' },
  { from: 'song', to: 'language', field: 'languageIds', description: 'Languages this song is in' },
  { from: 'song', to: 'region',   field: 'regionIds',   description: 'Regions associated with this song' },
  { from: 'song', to: 'source',   field: 'sourceIds',   description: 'Sources verifying facts about this song' },
  { from: 'song', to: 'question', field: 'questionIds', description: 'Questions about this song' },

  // Singer relationships
  { from: 'singer', to: 'song',     field: 'songIds',     description: 'Songs performed by this singer' },
  { from: 'singer', to: 'album',    field: 'albumIds',    description: 'Albums this singer appears on' },
  { from: 'singer', to: 'language', field: 'languageIds', description: 'Languages this singer performs in' },
  { from: 'singer', to: 'region',   field: 'regionIds',   description: 'Regions associated with this singer' },
  { from: 'singer', to: 'source',   field: 'sourceIds',   description: 'Sources verifying facts about this singer' },
  { from: 'singer', to: 'question', field: 'questionIds', description: 'Questions about this singer' },

  // Writer relationships
  { from: 'writer', to: 'song',    field: 'songIds',    description: 'Songs authored by this writer' },
  { from: 'writer', to: 'concept', field: 'conceptIds', description: 'Concepts in this writer\'s works' },
  { from: 'writer', to: 'region',  field: 'regionIds',  description: 'Regions associated with this writer' },
  { from: 'writer', to: 'source',  field: 'sourceIds',  description: 'Sources verifying facts about this writer' },
  { from: 'writer', to: 'question',field: 'questionIds',description: 'Questions about this writer' },

  // Album relationships
  { from: 'album', to: 'song',   field: 'songIds',   description: 'Songs on this album' },
  { from: 'album', to: 'singer', field: 'singerIds', description: 'Singers on this album' },
  { from: 'album', to: 'region', field: 'regionIds', description: 'Regions associated with this album' },
  { from: 'album', to: 'source', field: 'sourceIds', description: 'Sources verifying facts about this album' },
  { from: 'album', to: 'question', field: 'questionIds', description: 'Questions about this album' },

  // Concept relationships
  { from: 'concept', to: 'song',   field: 'relatedSongIds',   description: 'Songs that express this concept' },
  { from: 'concept', to: 'writer', field: 'relatedWriterIds', description: 'Writers who engage with this concept' },
  { from: 'concept', to: 'source', field: 'sourceIds',        description: 'Sources verifying facts about this concept' },
  { from: 'concept', to: 'question', field: 'questionIds',    description: 'Questions about this concept' },

  // Language relationships
  { from: 'language', to: 'source',   field: 'sourceIds',   description: 'Sources verifying facts about this language' },
  { from: 'language', to: 'question', field: 'questionIds', description: 'Questions about this language' },

  // Region relationships
  { from: 'region', to: 'source',   field: 'sourceIds',   description: 'Sources verifying facts about this region' },
  { from: 'region', to: 'question', field: 'questionIds', description: 'Questions about this region' },

  // Question relationships
  { from: 'question', to: 'source', field: 'sourceIds', description: 'Sources verifying this answer' },
];
