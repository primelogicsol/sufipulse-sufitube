# DATASET REPAIR PLAN

## SufiPulse Knowledge Authority Database — Phase 2.5 Strategy

> **Purpose:** This document defines HOW to repair the 6 categories of failure identified in the Gold Dataset Audit.
> **Constraint:** This is a strategy document only. No implementation until approved.

---

## Repair Priority Order

```
Priority 1:  Source linkage           (existential — without this, nothing is verifiable)
Priority 2:  Language + Region seeds  (structural — 2 of 5 graph axes are empty)
Priority 3:  Duplicate resolution     (integrity — 13 songs need merge/differentiate decisions)
Priority 4:  Schema patches           (structural — missing fields prevent correct classification)
Priority 5:  Orphan resolution        (coverage — 54% of writers and singers are disconnected)
Priority 6:  Attribution gaps         (quality — 40% of songs have no writer)
```

---

## REPAIR 1 — Source Linkage

### Problem

250 entities reference 17 source IDs. Those 17 IDs now resolve to `gold_sources.json` (100 sources). But the linkage has never been audited for correctness.

### Strategy

```
Step 1: Verify that each of the 17 original source IDs maps to the correct source.

  src_000001 → Schimmel, "Mystical Dimensions of Islam"
  src_000002 → Trimingham, "The Sufi Orders in Islam"
  src_000003 → Encyclopaedia of Islam (EI2)
  src_000004 → Arberry, "Sufism: An Account of the Mystics of Islam"
  src_000005 → Ernst, "The Shambhala Guide to Sufism"
  src_000006 → Qureshi, "Sufi Music of India and Pakistan"
  src_000007 → Hujwiri, "Kashf al-Mahjub" (Nicholson trans.)
  src_000008 → al-Qushayri, "al-Risala" (Knysh trans.)
  src_000011 → Lewis, "Rumi: Past and Present, East and West"
  src_000013 → de Bruijn, "Persian Sufi Poetry"
  src_000014 → Rizvi, "A History of Sufism in India"
  src_000015 → Grove Music Online
  src_000016 → Shackle, "Bullhe Shah: Sufi Lyrics"
  src_000017 → Sorley, "Shah Abdul Latif of Bhit"
  src_000018 → Rafiqi, "Sufism in Kashmir"
  src_000019 → Discogs
  src_000020 → MusicBrainz

Step 2: For each entity, verify that each sourceId actually supports the claims made.
         Example: Does src_000006 (Qureshi) actually discuss singer_000001 (NFAK)?
         Answer: Yes — Qureshi's study covers qawwali tradition including NFAK's family lineage.

Step 3: Add new sourceIds from the expanded gold_sources.json (100 sources) where
        more specific or more authoritative sources are available.
        Example: writer_000001 (Rumi) should also reference src_000011 (Lewis)
        and src_000027 (Nicholson Masnavi) — both more specific than generic references.

Step 4: Ensure every entity meets the minimum source requirement per
        ENTITY_VERIFICATION_RULES.md.
```

### Estimated Effort

```
Entities to audit:    250
Expected repairs:     ~100 (adding more specific sourceIds)
Expected rejections:  0 (all current entities have at least 3 source IDs)
```

---

## REPAIR 2 — Language and Region Seeds

### Problem

`languageIds[]` and `regionIds[]` are 100% empty across all 250 entities. The seed files for languages and regions were planned (Phase 2A, 2B) but never created.

### Strategy

```
Step 1: Create seed_languages.json

  Target: 25–35 languages
  Must include at minimum:
    Persian, Arabic, Urdu, Punjabi, Sindhi, Saraiki, Kashmiri,
    Pashto, Turkish, Hindi, Hindavi, Bengali, Balochi, Rajasthani,
    Braj Bhasha, Pothohari, Malay, Indonesian

  Each language entry requires:
    id, slug, name, iso639Code, scriptName, regionIds[], sourceIds[]

Step 2: Create seed_regions.json

  Target: 50–75 regions
  Must include at minimum:
    Punjab, Sindh, Kashmir, Balochistan, Anatolia, Khorasan,
    Balkh, Konya, Bukhara, Samarkand, Delhi, Lahore, Multan,
    Ajmer, Pakpattan, Sehwan, Bhit Shah, Baghdad, Basra,
    Nishapur, Shiraz, Tabriz, Herat, Kabul, Ghazna,
    Faisalabad, Hyderabad (Sindh), Rajasthan, Bengal

  Each region entry requires:
    id, slug, name, country, latitude, longitude, sourceIds[]

Step 3: Populate languageIds[] across all entities

  For writers:  Derive from existing languages[] field (already populated as strings)
  For singers:  Derive from biography and known performance languages
  For songs:    Derive from writer's language + known performance language
  For concepts: Not applicable (concepts are language-agnostic)

Step 4: Populate regionIds[] across all entities

  For writers:  Derive from biography (birthplace, primary residence)
  For singers:  Derive from biography (country, city of origin)
  For songs:    Derive from writer's region + performance tradition region
  For concepts: Not applicable (concepts are region-agnostic)
```

### Estimated Effort

```
New files to create:        2 (seed_languages.json, seed_regions.json)
Entity fields to populate:  ~500 (languageIds across 200 entities + regionIds across 200 entities)
```

### Dependency

- seed_languages.json must be created BEFORE any languageIds can be populated
- seed_regions.json must be created BEFORE any regionIds can be populated
- Writers already have a `languages[]` string array that provides the mapping data

---

## REPAIR 3 — Duplicate Resolution

### Problem

8 duplicate pairs involving 13 songs were identified in the audit.

### Strategy

Each pair requires one of three decisions:

```
MERGE:        Two entries represent the same composition → merge into single entry
DIFFERENTIATE: Two entries are distinct compositions → add clarifying metadata
RENDITION:    Two entries are the same song by different performers → merge singerIds
```

### Specific Decisions Required

| Pair | Songs | Recommended Action |
|---|---|---|
| 1 | `song_000007` "Tere Ishq Nachaya" / `song_000072` "Tera Ishq Nachaaya" | **MERGE.** Same kafi, variant spellings. Keep song_000007, delete song_000072, merge singerIds. |
| 2 | `song_000008` "Bulla Ki Jaana Main Kaun" / `song_000090` "Ki Jaana Main Kaun" | **MERGE.** Same kafi, variant title. Keep song_000008, delete song_000090, merge data. |
| 3 | `song_000005` "Dama Dam Mast Qalandar" / `song_000079` "Dam Mast Qalandar (NFAK)" | **MERGE.** Same composition, different performer label. Keep song_000005, add NFAK rendition notes, delete song_000079. |
| 4 | `song_000014` "Lagi Bina" / `song_000034` "Rang" | **DIFFERENTIATE.** Both are Shah Hussain kafis about Basant, but they are different compositions with different opening verses. Add clarifying metadata to both. Remove "Rang" from song_000014 alternateTitles. |
| 5 | `song_000005` "Dama Dam Mast Qalandar" / `song_000020` "Shahbaz Qalandar" | **DIFFERENTIATE.** "Dama Dam Mast Qalandar" is the specific song. "Shahbaz Qalandar" is a broader manqabat. Different lyrical content. Add clarifying metadata. |
| 6 | `song_000005` "Dama Dam Mast Qalandar" / `song_000059` "Lal Meri Pat Rakhiyo" | **EVALUATE.** These may be the same composition with different opening lines depending on region. Requires source verification. Flag for Phase 2.5 deep review. |
| 7 | `song_000059` "Lal Meri Pat Rakhiyo" / `song_000060` "O Lal Meri" | **MERGE.** Same devotional, variant opening. Keep song_000059, merge data from song_000060. |
| 8 | `song_000006` "Allah Hu" / `song_000017` "Allah Hoo Allah Hoo" | **DIFFERENTIATE.** Both are dhikr compositions but represent different musical arrangements and performance contexts. Add clarifying metadata. |

### Post-Resolution Count

```
Current songs:          100
Merged (deleted):        -4 (songs 072, 090, 079, 060)
Remaining songs:         96
Differentiated:           3 pairs (clarified but retained)
Pending deep review:      1 pair (songs 005/059)
```

---

## REPAIR 4 — Schema Patches

### Problem

The current schema lacks fields needed for accurate classification.

### Required Schema Changes

```
1. ADD to writers.schema.ts:
   alternateNames: string[]
   — Captures variant spellings/names (e.g., Rumi / Mawlana / Mevlana)

2. ADD to singers.schema.ts:
   alternateNames: string[]
   — Captures variant spellings/names

3. ADD to songs.schema.ts:
   attributionStatus: "attributed" | "traditional" | "disputed" | "unknown"
   — Distinguishes known authorship from anonymous/traditional compositions
   — Required for all songs; eliminates ambiguity of empty writerIds[]

4. ADD to songs.schema.ts:
   compositionType: "performed" | "literary" | "liturgical"
   — Distinguishes performed songs from literary texts (Rumi's Masnavi, Lal Ded's Vakhs)
   — Resolves the song-vs-poem classification problem
```

### Impact

```
Entities affected by alternateNames:     ~100 (most writers and many singers have alternate names)
Entities affected by attributionStatus:   100 (all songs)
Entities affected by compositionType:     100 (all songs)
Schema files to modify:                    3 (writers, singers, songs)
```

---

## REPAIR 5 — Orphan Resolution

### Problem

27/50 writers and 27/50 singers are not referenced by any song.

### Strategy

Two approaches, applied entity-by-entity:

```
APPROACH A: Add songs that reference the orphaned entity
  — The writer/singer is important and songs exist but are not in the dataset
  — Action: Create new song entries referencing the orphaned entity

APPROACH B: Reclassify the entity as "reference" status
  — The writer/singer is important for the knowledge graph but
    does not have performable songs in the current dataset scope
  — Action: Change status from "published" to "reference"
  — They remain in the database but are not counted toward Gold Dataset metrics
```

### Decision Matrix

| Entity Type | Approach A Candidates | Approach B Candidates |
|---|---|---|
| **Writers — Approach A** (add songs) | Hafiz Shirazi, Saadi Shirazi, Bedil, Kabir (already has songs), Sarmad Kashani, Makhdoom Bilawal, Pir Meher Ali Shah | |
| **Writers — Approach B** (reference) | Rabia al-Adawiyya, Ibn Arabi, al-Ghazali, Jami, Sanai, al-Qushayri, Junayd, Dhul-Nun, Bayazid, Hasan al-Basri, Ahmad Ghazali, Nizamuddin Auliya, Ahmad Sirhindi, Shah Waliullah, Shams-e Tabrizi, Ayn al-Quzat, Abu Sa'id, Fakhr al-Din Iraqi, Mahmud Shabistari, Shah Nimatullah | |
| **Singers — Approach A** (add songs) | Faiz Ali Faiz, Ghulam Ali, Attaullah Khan, Malika Pukhraj, Rizwan-Muazzam, Mame Khan, Hamza Akram | |
| **Singers — Approach B** (reference) | Abu Muhammad (part of duo), Tina Sani, Munshi Raziuddin, Bahauddin Khan, Meraj Ahmed Nizami, Tahira Syed, Akhtar Sharif, Mehr Ali & Sher Ali, Mubarak Ali Khan, Asif Ali Santoo, Jafar Hussain Badayuni, Ali Haider, Shafqat Amanat Ali, Raees Khan, Sain Akhtar, Zeb Bangash, Abida Hussain, Haji Ghulam Farid Sabri, Ustad Bahauddin, Munir Hussain | |

### Estimated Impact

```
Approach A writers → ~7 new songs needed
Approach A singers → ~7 new songs needed
Total new songs:     ~14 (bringing total from 96 to ~110 after dedup)
Approach B writers → ~20 reclassified to "reference"
Approach B singers → ~20 reclassified to "reference"
```

---

## REPAIR 6 — Attribution Gaps

### Problem

40/100 songs have empty `writerIds[]`. Some are genuinely traditional/anonymous, others are data entry failures.

### Strategy

```
Step 1: For each song with empty writerIds[], determine:
  a. Is the writer known? → Add writerIds[], set attributionStatus = "attributed"
  b. Is the writer disputed? → Set attributionStatus = "disputed", add notes
  c. Is the song traditional/anonymous? → Set attributionStatus = "traditional"
  d. Has research not been done? → Set attributionStatus = "unknown", flag for research

Step 2: For songs where writer IS known but not in gold_writers.json:
  Example: "Ranjish Hi Sahi" → writer is Ahmad Faraz (not a Sufi poet)
  Decision: Do NOT add non-Sufi writers to gold_writers.json.
  Instead: Add a writerNote field or external reference.

Step 3: For songs where writer is named in summary but missing from writerIds[]:
  Example: song_000026 summary mentions "Ahmad Faraz" but writerIds is empty
  Action: Either add writer to dataset or add writerNote with explanation.
```

### Known Attribution Decisions

| Song | Current Writer | Correct Attribution | Action |
|---|---|---|---|
| song_000004 "Tajdar-e-Haram" | [] | Multiple lyricists, traditional composition | attributionStatus = "traditional" |
| song_000015 "Hashr Ke Roz" | [] | Aziz Mian (writer-performer) | Need decision: is he writer or only performer? |
| song_000016 "Mustt Mustt" | [] | Traditional qawwali, NFAK arrangement | attributionStatus = "traditional" |
| song_000026 "Ranjish Hi Sahi" | [] | Ahmad Faraz (modern Urdu poet, not Sufi) | writerNote, NOT gold_writers entry |
| song_000041 "Afreen Afreen" | [] | Javed Akhtar (Bollywood lyricist) | writerNote, NOT gold_writers entry |

### Estimated Impact

```
Songs needing attributionStatus:      40
Songs needing writerNote (non-Sufi writers): ~10
Songs needing writerIds added:        ~5
Songs genuinely traditional:          ~25
```

---

## Execution Order Summary

```
Phase 2.5A: Create seed_languages.json + seed_regions.json
Phase 2.5B: Apply schema patches (alternateNames, attributionStatus, compositionType)
Phase 2.5C: Resolve 8 duplicate pairs
Phase 2.5D: Populate languageIds[] + regionIds[] across all entities
Phase 2.5E: Verify source linkage (sourceIds → gold_sources.json)
Phase 2.5F: Resolve orphaned entities (Approach A: add songs, Approach B: reclassify)
Phase 2.5G: Resolve attribution gaps
Phase 2.5H: Run full verification audit against ENTITY_VERIFICATION_RULES.md
```

### Success Criteria for Phase 2.5

```
✓ 0 phantom source references
✓ 0 empty languageIds[] (on applicable entities)
✓ 0 empty regionIds[] (on applicable entities)
✓ 0 duplicate entries
✓ All songs have attributionStatus
✓ All songs have compositionType
✓ All writers have alternateNames[]
✓ All singers have alternateNames[]
✓ Every entity passes ENTITY_VERIFICATION_RULES.md
✓ Full audit report passes with 0 high-risk issues
```

---

## What This Plan Does NOT Include

```
✗ No new entity types
✗ No relationship graph construction
✗ No API development
✗ No UI development
✗ No search engine
✗ No AI features
✗ No scoring systems
✗ No analytics
```

This plan repairs the existing dataset. Nothing more.
