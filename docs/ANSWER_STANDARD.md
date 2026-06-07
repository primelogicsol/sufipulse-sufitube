# ANSWER STANDARD

## Phase 4.1 — Canonical Answer Model

This document defines the strict schema and content guidelines for all answers in the SufiPulse Question & Answer Knowledge Layer.

### Core Philosophy

The graph exists to support answers. Search engines and AI systems consume answers. Therefore, every answer must be factual, directly derived from the Gold Dataset, and strictly tethered to verified sources and entities.

### Schema Requirements

Every object in `gold_questions.json` must adhere exactly to this schema:

```typescript
interface QAEntity {
  /** Unique ID (e.g., q_000001) */
  id: string;

  /** Canonical Question Text */
  question: string;

  /** Verified Answer Text (1-3 sentences, factual, encyclopedic) */
  answer: string;

  /** Question Class (from QUESTION_ARCHITECTURE.md) */
  questionClass: "Definition" | "Identity" | "Authorship" | "Meaning" | "Language" | "Origin" | "Relationship" | "Performance" | "Album" | "Concept" | "Influence" | "Comparison";

  /** Array of verified source IDs supporting this answer */
  sourceIds: string[];

  /** Array of entity IDs referenced or queried in this answer */
  entityIds: string[];

  /** Status of the QA pair */
  status: "published" | "review" | "archived";

  /** Confidence level based on source tier */
  confidenceLevel: "high" | "medium" | "low";

  /** Audit timestamp */
  lastReviewed: string;
}
```

### Content Rules

1. **Self-Contained:** Answers must make sense without the question context. (e.g., "Amir Khusrau was a 13th-century Sufi musician," not "He was a 13th-century musician.")
2. **Attributed:** Answers must never synthesize new facts. If the dataset states the song is traditional, the answer must state the authorship is traditional or unknown.
3. **No Conversational Filler:** Do not use "Yes," "No," "Here is the answer," or "According to sources." Provide the direct fact.
4. **Source Linkage:** `sourceIds` must contain ONLY IDs that exist in `gold_sources.json`.
5. **Entity Linkage:** `entityIds` must contain ONLY IDs that exist in the approved Gold Dataset entity files.
6. **No Orphan Questions:** Every question must have an answer, source, and entity linkage.
