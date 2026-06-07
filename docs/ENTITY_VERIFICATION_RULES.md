# ENTITY VERIFICATION RULES

## SufiPulse Knowledge Authority Database — Verification Standard

> **Rule:** No entity enters the Gold Dataset without meeting these minimum verification thresholds.
> These rules apply to all new entities AND to existing entities during Phase 2.5 repair.

---

## Writer Verification

### Minimum Requirements

```
1. At least 1 Tier 1 source for biography
2. At least 1 Tier 1 or Tier 2 source for region/geography
3. At least 1 Tier 1 or Tier 2 source for language(s)
4. At least 1 independent source (different from above three)
```

### Total Minimum: 3 unique sources (if one source covers multiple requirements)

### Mandatory Fields (cannot be empty)

```
name             — Full canonical name
biography        — Minimum 2 sentences with verifiable claims
languages[]      — At least 1 language
regionIds[]      — At least 1 region
sourceIds[]      — At least 3 source IDs
```

### Conditional Fields

```
associatedOrder  — Required if the writer was affiliated with a known tariqa
                   Set to "" only if no order affiliation is documented
works[]          — At least 1 known work (can be "Attributed sayings" for oral figures)
```

### Rejection Criteria

```
✗ No Tier 1 source for biography
✗ Uncertain identity (disputed whether person existed)
✗ Conflation of two distinct historical figures
✗ Biography contains only AI-generated or Wikipedia-derived text
✗ languages[] empty
✗ regionIds[] empty
```

### Flagging (Accepted but Flagged)

```
⚠ Single authenticated work only
⚠ Dates uncertain (approximate century known, exact years unknown)
⚠ Order affiliation disputed among scholars
⚠ alternateNames may cause future deduplication conflicts
```

---

## Singer Verification

### Minimum Requirements

```
1. At least 1 Tier 2 source for biography (Tier 1 preferred)
2. At least 1 Tier 2 or Tier 3 source for discography/performance history
3. At least 1 source for geographic origin
4. At least 1 independent source (different from above)
```

### Total Minimum: 3 unique sources

### Mandatory Fields (cannot be empty)

```
name             — Full canonical name
biography        — Minimum 2 sentences with verifiable claims
country          — Country of origin or primary activity
birth            — Birth year (if documented; "unknown" if genuinely unknown)
languageIds[]    — At least 1 language of performance
regionIds[]      — At least 1 region
sourceIds[]      — At least 3 source IDs
```

### Conditional Fields

```
death            — Required if the singer is deceased
                   Set to "" only for living artists
```

### Rejection Criteria

```
✗ No verifiable biography from any Tier 1 or Tier 2 source
✗ Cannot confirm the person performed Sufi music (not folk, pop, or Bollywood only)
✗ Duplicate of existing entity under different name
✗ languageIds[] empty
✗ regionIds[] empty
✗ birth unknown AND biography is less than 3 verifiable sentences
```

### Flagging

```
⚠ Birth year uncertain or estimated
⚠ Primarily known for non-Sufi music (pop crossover, Bollywood playback)
⚠ Part of a duo/group — requires GROUP ENTITY DECISION
⚠ Possible confusion with singer of similar name
```

### Group Entity Rule

```
Duos and groups must be treated consistently:
OPTION A: Single entity with combined name (e.g., "Sabri Brothers")
OPTION B: Separate entities for each member with cross-reference

Current dataset uses BOTH approaches inconsistently.
A single approach must be chosen and applied universally.
```

---

## Song Verification

### Minimum Requirements

```
1. Writer verification:
   a. If writer is known: writerIds[] must contain verified writer(s)
   b. If writer is unknown: attributionStatus must be set to "traditional" or "unknown"
   c. If writer is disputed: attributionStatus must be set to "disputed"

2. Singer verification (if performed):
   a. singerIds[] must contain at least 1 verified singer
   b. If literary text only (no known performers): singerIds[] may be empty
      BUT genre must indicate "Literary Text" or equivalent

3. Language verification:
   a. languageIds[] must contain at least 1 language
   b. Source for language identification required

4. At least 3 source IDs total
```

### Mandatory Fields (cannot be empty)

```
title            — Primary canonical title
summary          — Minimum 2 sentences describing the composition
genre            — Specific genre classification
era              — Time period (century or specific date range)
languageIds[]    — At least 1 language
sourceIds[]      — At least 3 source IDs
```

### Conditional Fields

```
writerIds[]      — Required if writer is known; empty ONLY with attributionStatus
singerIds[]      — Required if performed; empty ONLY for literary texts
regionIds[]      — At least 1 region (geographic origin or performance context)
alternateTitles  — Required if known alternate spellings exist
```

### Rejection Criteria

```
✗ No writer AND no attributionStatus field
✗ writerIds[] references a non-existent writer
✗ singerIds[] references a non-existent singer
✗ languageIds[] empty
✗ Duplicate of existing song under different title (must be merged or differentiated)
✗ Summary is less than 2 sentences
✗ No Sufi connection established (secular songs without mystical context)
```

### Flagging

```
⚠ Writer disputed between 2+ candidates
⚠ Multiple renditions exist as separate entries (must decide: merge or differentiate)
⚠ Song is actually a long poem/literary text, not a performed composition
⚠ Genre classification uncertain
```

### Deduplication Rule for Songs

```
Two entries represent the SAME SONG if:
  - Same writer AND same underlying text
  - Different titles are merely variant spellings or translations

Two entries represent DIFFERENT SONGS if:
  - Different underlying texts (different lyrics/verses)
  - Different writers
  - Same devotional subject but distinct compositions

A "rendition" (same song by different performer) is NOT a separate song entity.
Renditions are captured by adding singerIds[] to the existing song entry.
```

---

## Concept Verification

### Minimum Requirements

```
1. At least 1 Tier 1 source for definition (academic book or primary text)
2. At least 1 cross-reference source (Tier 1 or Tier 3 encyclopedia)
3. Definition must be based on primary Sufi texts or recognized scholarship
```

### Total Minimum: 3 unique sources

### Mandatory Fields (cannot be empty)

```
name             — Canonical transliterated name
definition       — Minimum 2 sentences with scholarly basis
sourceIds[]      — At least 3 source IDs
```

### Rejection Criteria

```
✗ Definition is AI-generated without scholarly basis
✗ Concept is not recognized in established Sufi literature
✗ Duplicate of existing concept under different transliteration
```

---

## Cross-Entity Verification

### Every ID reference must resolve

```
writerIds[]   → every ID must exist in gold_writers.json
singerIds[]   → every ID must exist in gold_singers.json
conceptIds[]  → every ID must exist in gold_concepts.json
sourceIds[]   → every ID must exist in gold_sources.json
languageIds[] → every ID must exist in seed_languages.json (when created)
regionIds[]   → every ID must exist in seed_regions.json (when created)
```

### Phantom references are forbidden

Any entity containing an ID that does not resolve to an existing entity in the database is in violation and must be flagged for repair.

---

## Verification Status Fields

### Entity Status

```
"published"     — Fully verified, all mandatory fields populated, all sources resolved
"review"        — Structurally complete but flagged for one or more issues
"draft"         — Missing mandatory fields, not ready for publication
"disputed"      — Contains claims that are actively disputed among sources
"archived"      — Removed from active dataset but retained for reference
```

### Attribution Status (Songs only — NEW FIELD REQUIRED)

```
"attributed"    — Writer is known and verified
"traditional"   — Composition is traditional/anonymous with no known individual author
"disputed"      — Multiple writers claimed, attribution uncertain
"unknown"       — Writer research incomplete, not yet determined
```
