# SOURCE UNIVERSE

## SufiPulse Knowledge Authority Database — Source Governance

> **Rule:** Nothing gets ingested without a source path.

---

## Approved Source Classes

### Tier 1 — Primary Authority

```
Academic Books
Academic Journals
Library Archives
National Archives
University Publications
Cultural Institutions
```

### Tier 2 — Structured Databases

```
MusicBrainz
Discogs
Library of Congress
WorldCat
JSTOR
Google Scholar
```

### Tier 3 — Verified Reference

```
Official Artist Websites
Recording Labels (official catalogs)
Encyclopaedia of Islam
Encyclopaedia Iranica
Oxford Encyclopedia of the Islamic World
Grove Music Online
```

### Tier 4 — Supplementary Only

```
Wikipedia (cross-reference only, never sole source)
Wikidata (structured data cross-reference)
YouTube (performance verification only)
```

### Forbidden Sources

```
Social media posts
Fan wikis
Unattributed blog posts
AI-generated content
Forum discussions
Unverified personal websites
```

---

## Entity Verification Rules

### Writer Entity — Minimum Requirements

```
1 Biography Source (Tier 1 or Tier 2)
1 Region Source (Tier 1, 2, or 3)
1 Language Source (Tier 1, 2, or 3)
1 Verification Source (independent from the above)
```

Otherwise: DO NOT INGEST.

### Singer Entity — Minimum Requirements

```
1 Biography Source (Tier 1 or Tier 2)
1 Discography Source (Tier 2 or Tier 3)
1 Region Source (Tier 1, 2, or 3)
1 Verification Source (independent from the above)
```

Otherwise: DO NOT INGEST.

### Song Entity — Minimum Requirements

```
1 Attribution Source (writer verification, Tier 1 or Tier 2)
1 Performance Source (singer/recording verification, Tier 2 or Tier 3)
1 Language Verification Source (Tier 1, 2, or 3)
```

Otherwise: DO NOT INGEST.

### Album Entity — Minimum Requirements

```
1 Catalog Source (Tier 2 or Tier 3: MusicBrainz, Discogs, or label catalog)
1 Artist Verification Source (linked singer must already be verified)
```

Otherwise: DO NOT INGEST.

### Concept Entity — Minimum Requirements

```
1 Academic Definition Source (Tier 1)
1 Cross-Reference Source (Tier 1 or Tier 3 encyclopedia)
```

Otherwise: DO NOT INGEST.

### Language Entity — Minimum Requirements

```
1 ISO Standard Reference
1 Cultural Context Source (Tier 1 or Tier 3)
```

Otherwise: DO NOT INGEST.

### Region Entity — Minimum Requirements

```
1 Geographic Reference Source
1 Sufi Heritage Context Source (Tier 1 or Tier 3)
```

Otherwise: DO NOT INGEST.

---

## Minimum Source Requirements Per Entity

```
Writers:   4 sources minimum
Singers:   4 sources minimum
Songs:     3 sources minimum
Albums:    2 sources minimum
Concepts:  2 sources minimum
Languages: 2 sources minimum
Regions:   2 sources minimum
Questions: 1 source minimum (the answer source)
```

---

## Gold Dataset Criteria

Before full-scale ingestion, a Gold Dataset must be created and verified:

```
50 Writers    — fully sourced, verified
50 Singers    — fully sourced, verified
100 Songs     — fully sourced, verified
50 Concepts   — fully sourced, verified
```

### Gold Dataset Verification Checklist

For each entity in the Gold Dataset:

```
✓ All minimum sources present
✓ No single-source entities
✓ At least one Tier 1 source
✓ All source IDs resolve to real entries in seed_sources.json
✓ No duplicate entities
✓ No placeholder text
✓ No AI-generated biographical content
✓ Cross-references verified (e.g., writer linked to song exists)
```

### Gold Dataset Approval Process

```
1. Gold Dataset created
2. Source linkage verified
3. Report submitted
4. Await approval
5. Only then proceed to full ingestion
```

---

## Source Entry Standard

Every source in the database must include:

```
title:     Full title of the work
author:    Author or institution
type:      One of the approved source types
url:       URL if available
publisher: Publisher or issuing body
year:      Year of publication
citation:  Formatted citation string
```

---

## Authority Formula

```
Authority ≠ Entity Count
Authority = Verified Entity Count × Source Depth
```

A database with 100 verified entities is more valuable than a database with 2,000 unverified entities.
