# SOURCE TIER RULES

## SufiPulse Knowledge Authority Database — Source Classification Standard

> **Rule:** Every source in the database must be assigned exactly one tier.
> The tier determines what the source can verify and how much weight it carries.

---

## Tier 1 — Primary Authority

### Definition

Sources produced by qualified scholars, academic institutions, or primary historical archives with editorial review processes.

### Includes

```
Academic Books (published by university presses or recognized academic publishers)
Peer-Reviewed Journal Articles
National Archives (government-maintained historical records)
Library Archives (British Library, Library of Congress, etc.)
Critical Editions (scholarly editions of primary texts with apparatus)
Primary Texts in Translation (by qualified translators with academic credentials)
```

### Weight

- **Can independently verify:** Biography, doctrine, attribution, dates, works
- **Can serve as sole source for:** Doctrinal definitions, literary analysis
- **Minimum representation per Gold entity:** At least 1 Tier 1 source required

### Examples from Gold Sources

```
src_000001  Schimmel, "Mystical Dimensions of Islam"
src_000003  Encyclopaedia of Islam (EI2)
src_000006  Qureshi, "Sufi Music of India and Pakistan"
src_000007  Hujwiri, "Kashf al-Mahjub" (Nicholson trans.)
src_000011  Lewis, "Rumi: Past and Present, East and West"
src_000016  Shackle, "Bullhe Shah: Sufi Lyrics"
```

---

## Tier 2 — Institutional / Structured

### Definition

Sources from established institutions, museums, structured databases, or university departments that maintain editorial or curatorial standards, but are not peer-reviewed academic publications.

### Includes

```
University Publications (departmental archives, thesis collections)
Structured Databases (MusicBrainz, Discogs, WorldCat, JSTOR, Google Scholar)
Cultural Institutions (Lok Virsa, Sindhica Academy, Sangeet Natak Akademi)
Museums (Mevlana Museum, shrine cultural centers)
Shrine Committees (official institutional records)
Broadcasting Archives (PTV, Radio Pakistan)
Government Heritage Bodies (PNCA, Auqaf departments)
```

### Weight

- **Can independently verify:** Discography, institutional affiliation, performance history, birth/death dates
- **Cannot independently verify:** Doctrinal claims, literary attribution, theological interpretation
- **Can supplement Tier 1 for:** Biographical cross-reference, geographic context
- **Minimum for Singer entity:** At least 1 Tier 2 source required

### Examples from Gold Sources

```
src_000019  Discogs
src_000020  MusicBrainz
src_000031  Lok Virsa
src_000050  Bhittai Cultural Centre, Bhit Shah
src_000051  Mevlana Museum, Konya
src_000062  PTV Archives
```

---

## Tier 3 — Verified Reference

### Definition

Sources from established organizations or official publications that are not academic or institutional, but maintain professional editorial standards.

### Includes

```
Reference Works (Grove Music Online, Oxford Encyclopedias)
Official Artist Websites (maintained by estate or foundation)
Official Foundations (NFAK Foundation, Yunus Emre Institute)
Recording Labels (EMI Pakistan, Real World Records, Smithsonian Folkways)
Broadcast Platforms with Editorial Oversight (Coke Studio official archive)
```

### Weight

- **Can verify:** Discography credits, performer identity, release dates, performance documentation
- **Cannot independently verify:** Historical biography, doctrinal claims, literary attribution
- **Must be paired with:** At least 1 Tier 1 or Tier 2 source
- **Never sufficient as sole source for any entity**

### Examples from Gold Sources

```
src_000015  Grove Music Online
src_000046  EMI Pakistan
src_000047  Real World Records
src_000048  NFAK Foundation
src_000061  Coke Studio Pakistan
```

---

## Tier 4 — Supplementary Only

### Definition

Sources that are community-maintained, user-generated, or editorially uncontrolled. May contain valuable data but cannot be trusted without independent verification.

### Includes

```
Wikipedia (cross-reference only — follow cited sources to primary material)
Wikidata (structured data cross-reference only)
YouTube (performance verification only — confirms a recording exists)
```

### Weight

- **Can verify:** Nothing independently
- **Can support:** Identifying alternate names, finding primary sources cited within
- **Must be paired with:** At least 1 Tier 1 AND 1 Tier 2 source
- **Maximum Tier 4 sources per entity:** 1
- **Never counts toward minimum source requirements**

### Examples from Gold Sources

```
src_000075  Wikidata
src_000076  Wikipedia (English)
```

---

## Forbidden Sources

### Definition

Sources that are never acceptable regardless of content.

```
Social media posts (Twitter, Facebook, Instagram)
Fan wikis (Fandom, fan-maintained sites)
Unattributed blog posts
AI-generated content (ChatGPT, Claude, etc.)
Forum discussions (Reddit, Quora, etc.)
Unverified personal websites
Press releases without verifiable claims
Promotional material without factual content
```

---

## Tier Assignment Rules

### Rule 1: Tier is assigned to the source, not the claim

A Tier 1 source remains Tier 1 even when cited for a minor fact. The tier reflects the source's overall reliability, not the importance of the individual claim.

### Rule 2: Tier cannot be upgraded

A community source does not become Tier 2 by being widely cited. Tier is inherent to the source type.

### Rule 3: Tier can be downgraded

If a Tier 2 source is found to contain systematic errors, it may be reclassified as Tier 3 or removed.

### Rule 4: Self-published primary texts are Tier 1

A Sufi master's own published work (e.g., Sultan Bahoo's Ain ul Faqr, Rumi's Masnavi) is Tier 1 as a primary text, regardless of publisher prestige.

### Rule 5: Translations inherit tier from publisher/translator

A translation by a recognized scholar (Nicholson, Arberry, Shackle) published by a university press is Tier 1. A translation by an unknown translator self-published online is not.

---

## Current Gold Source Distribution

```
Tier 1:  66 sources (66%)
Tier 2:  24 sources (24%)
Tier 3:   8 sources  (8%)
Tier 4:   2 sources  (2%)
Total:  100 sources
```

### By Type

```
Academic Book:          61
Cultural Institution:   10
Structured Database:     7
National Archive:        5
Reference Work:          4
University Publication:  4
Recording Label:         3
Library Archive:         2
Official Foundation:     2
Museum:                  1
Official Artist Website: 1
```
