# GOLD DATASET AUDIT

## Phase 2.3 — Pre-Relationship Quality Gate

> **Verdict: THE DATASET IS NOT READY FOR PHASE 3.**
>
> The dataset is structurally complete but **not genuinely authoritative.**
> Multiple categories of failure are documented below.

---

## AUDIT 1 — DUPLICATE DETECTION

### 🔴 HIGH RISK: Song Duplicates Found

| Entity A | Entity B | Issue |
|---|---|---|
| `song_000007` "Tere Ishq Nachaya" | `song_000072` "Tera Ishq Nachaaya" | **Same kafi, different spellings.** Same writer (Bulleh Shah), overlapping singers, identical concepts. These are the same composition stored as two entries. |
| `song_000008` "Bulla Ki Jaana Main Kaun" | `song_000090` "Ki Jaana Main Kaun" | **Same kafi, variant title.** Same writer (Bulleh Shah), same concepts (fana, nafs). These are the same composition. |
| `song_000005` "Dama Dam Mast Qalandar" | `song_000020` "Shahbaz Qalandar" | **Near-duplicate.** Both praise Lal Shahbaz Qalandar, both use `writer_000050`, both tagged dhamaal, overlapping singers. The boundary between "same song, different name" vs "distinct compositions" is **unresolved**. |
| `song_000005` "Dama Dam Mast Qalandar" | `song_000059` "Lal Meri Pat Rakhiyo" | **Near-duplicate.** `song_000005` lists "Laal Meri Pat" as alternate title. `song_000059` title is "Lal Meri Pat Rakhiyo." Same writer, overlapping singers. |
| `song_000005` "Dama Dam Mast Qalandar" | `song_000079` "Dam Mast Qalandar (NFAK)" | **Rendition duplicate.** Same composition, different performer packaging. Not a distinct song. |
| `song_000059` "Lal Meri Pat Rakhiyo" | `song_000060` "O Lal Meri" | **Near-duplicate.** Both Qalandar devotionals with overlapping content and context. |
| `song_000006` "Allah Hu" | `song_000017` "Allah Hoo Allah Hoo" | **Potential duplicate.** Same dhikr invocation, same singer (NFAK), same concepts. The difference is presentation, not composition. |
| `song_000014` "Lagi Bina" | `song_000034` "Rang" | **Cross-reference collision.** `song_000014` lists "Rang" as alternate title. `song_000034` is titled "Rang." Same writer (Shah Hussain), same singers. |

### Summary

| Status | Count |
|---|---|
| **Confirmed duplicates** | 3 pairs (songs 7/72, 8/90, 5/79) |
| **Probable duplicates** | 3 pairs (5/20, 5/59, 14/34) |
| **Questionable overlap** | 2 pairs (59/60, 6/17) |
| **Total duplicate candidates** | **8 pairs involving 13 songs** |

### 🟡 MEDIUM RISK: Writer Near-Duplicates

No exact duplicates by ID or name. However:

| Writer | Alternate Names (Not Captured) | Risk |
|---|---|---|
| `writer_000001` Jalal al-Din Muhammad Rumi | Mawlana, Mevlana, Rumi | Multiple romanizations will conflict with future ingestion |
| `writer_000013` Baba Fariduddin Ganjshakar | Baba Farid, Farid ud-Din, Sheikh Farid | Same person, 4+ common names |
| `writer_000050` Lal Shahbaz Qalandar | Syed Usman Marwandi, Jhulelal (sometimes conflated) | Identity conflation risk |
| `writer_000006` Lal Ded | Lalleshwari, Lal Arifa, Lalla | 3+ alternate names |
| `writer_000007` Nund Rishi | Sheikh Nur-ud-din Wali, Sheikh ul-Alam | 3+ alternate names |

**Schema gap:** The writer schema has no `alternateNames[]` field. This will cause deduplication failures at scale.

### 🟢 LOW RISK: Singer Duplicates

No exact duplicates detected. However:

| Singer | Risk |
|---|---|
| `singer_000022` Bahauddin Khan Qawwal | Potential confusion with `singer_000048` Ustad Bahauddin Qawwal — **may be same person** |

### 🟢 LOW RISK: Concept Duplicates

No duplicates detected. However:

| Concept A | Concept B | Risk |
|---|---|---|
| `concept_000035` Dargah | `concept_000036` Mazar | Overlapping definitions. In South Asian usage these are near-synonymous. |
| `concept_000023` Maqam | `concept_000024` Hal | Not duplicates, but their relationship (permanent vs transient) requires explicit linkage or confusion will occur. |

---

## AUDIT 2 — ATTRIBUTION AUDIT

### 🔴 CRITICAL: Empty `languageIds[]` Across Entire Dataset

| Entity Type | Entities with empty `languageIds[]` | Total | Percentage |
|---|---|---|---|
| Songs | **100** | 100 | **100%** |
| Singers | **50** | 50 | **100%** |

**Every single song and singer has `languageIds: []`.** This is a structural failure. The language field — one of the most important authority signals — is completely unpopulated.

### 🔴 CRITICAL: Empty `regionIds[]` Across Entire Dataset

| Entity Type | Entities with empty `regionIds[]` | Total | Percentage |
|---|---|---|---|
| Songs | **100** | 100 | **100%** |
| Writers | **50** | 50 | **100%** |
| Singers | **50** | 50 | **100%** |

**Every entity has `regionIds: []`.** Region is completely unpopulated. Without regions, the graph cannot support geographic authority.

### 🟡 Songs With No Writer Attribution

**40 of 100 songs (40%) have empty `writerIds[]`.**

These include well-known compositions where authorship is either:
- **Genuinely unknown** (traditional compositions)
- **Disputed** (multiple attributions exist)
- **Known but not recorded** (data entry failure)

Songs with missing writers that should have attributions:

| Song | Title | Issue |
|---|---|---|
| `song_000004` | Tajdar-e-Haram | Writer is known (multiple attributed lyricists) |
| `song_000015` | Hashr Ke Roz Yeh Poochhunga | Aziz Mian is often cited as writer+performer |
| `song_000018` | Tumhe Dillagi Bhool Jaani Padegi | Known Urdu poet wrote this ghazal |
| `song_000026` | Ranjish Hi Sahi | Writer is **Ahmad Faraz** — named in summary but not in `writerIds[]` |
| `song_000041` | Afreen Afreen | Writer is **Javed Akhtar** — not in writer dataset |

The remaining 35 songs without writers may be genuinely traditional/anonymous. These need explicit `attributionStatus: "traditional" | "disputed" | "unknown"` — a field that **does not exist in the schema**.

### 🟡 Songs With No Singer

**10 of 100 songs (10%) have empty `singerIds[]`.**

These are literary/textual works (Rumi's Masnavi, Lal Ded's Vakhs, Attar's Conference of the Birds, etc.) where the entity is a poem, not a performed song.

**This exposes a classification problem:** The schema conflates "songs" (performed compositions) with "poems" (literary texts). These are different entity types forced into one schema.

### 🟡 Singers With No Birth Year

**15 of 50 singers (30%) have no `birth` field.**

Affected singers: Meraj Ahmed Nizami, Rizwan-Muazzam, Akhtar Sharif, Mehr Ali & Sher Ali, Asif Ali Santoo Khan, Arif Feroz, Mukhtiar Ali, Jafar Hussain Badayuni, Iqbal Bahu, Raees Khan, Abida Hussain, Haji Ghulam Farid Sabri, Ustad Bahauddin Qawwal, Munir Hussain Qawwal, Sain Akhtar.

These are primarily traditional shrine performers with limited documented biographies. Their inclusion at "gold" level is **questionable** if biographical data cannot be independently verified.

---

## AUDIT 3 — SOURCE QUALITY AUDIT

### 🔴 CRITICAL: Source IDs Are Phantom References

The dataset references **17 unique source IDs**:

```
src_000001 through src_000020 (with gaps at 9, 10, 12)
```

**None of these source IDs resolve to an actual `seed_sources.json` file.** That file does not exist.

This means:
- **0 of 17 sources can be verified**
- **0 of 250 entities have traceable provenance**
- **The 3-source-per-entity rule is structurally satisfied but substantively empty**

### Source ID Frequency Distribution

| Source ID | Times Referenced | Presumed Tier | Presumed Identity |
|---|---|---|---|
| `src_000004` | ~150+ | Unknown | Possibly Encyclopaedia of Islam (referenced by nearly everything) |
| `src_000006` | ~80+ | Unknown | Possibly Qureshi's "Sufi Music of India and Pakistan" |
| `src_000020` | ~70+ | Unknown | Possibly a discography source |
| `src_000019` | ~60+ | Unknown | Possibly a music database |
| `src_000015` | ~60+ | Unknown | Possibly a South Asian music reference |
| `src_000003` | ~50+ | Unknown | Possibly a Sufi encyclopedia |
| `src_000001` | ~45+ | Unknown | Possibly an academic Sufism text |
| `src_000002` | ~30+ | Unknown | Possibly a Sufi orders reference |
| `src_000016` | ~25+ | Unknown | Possibly a Punjabi Sufi poetry source |
| `src_000017` | ~15+ | Unknown | Possibly a Sindhi literature source |
| `src_000005` | ~15+ | Unknown | Unknown |
| `src_000018` | ~8 | Unknown | Possibly a Kashmiri studies source |
| `src_000011` | ~8 | Unknown | Possibly a Rumi-specific source |
| `src_000013` | ~6 | Unknown | Unknown |
| `src_000014` | ~12 | Unknown | Possibly a South Asian regional source |
| `src_000007` | ~5 | Unknown | Possibly Kashf al-Mahjub related |
| `src_000008` | ~8 | Unknown | Possibly al-Qushayri's Risala related |

### Tier Distribution (Cannot Be Determined)

```
Tier 1 (Academic):     UNKNOWN — no seed_sources.json exists
Tier 2 (Databases):    UNKNOWN
Tier 3 (Reference):    UNKNOWN
Tier 4 (Supplementary): UNKNOWN
Unresolvable:          17/17 (100%)
```

---

## AUDIT 4 — RELATIONSHIP READINESS

### Linkage Status

| Relationship | Connected | Missing | Percentage Missing |
|---|---|---|---|
| Songs → Writers | 60/100 | 40 | **40%** |
| Songs → Singers | 90/100 | 10 | 10% |
| Songs → Concepts | 100/100 | 0 | 0% |
| Songs → Languages | 0/100 | 100 | **100%** |
| Songs → Regions | 0/100 | 100 | **100%** |
| Writers → Regions | 0/50 | 50 | **100%** |
| Singers → Languages | 0/50 | 50 | **100%** |
| Singers → Regions | 0/50 | 50 | **100%** |

### Verdict: NOT READY

The dataset has **zero language linkage** and **zero region linkage** across all entity types. A relationship graph built on this data would be missing two of the five primary axes (language, region, writer, singer, concept).

### Writers Not Referenced By Any Song (27/50 = 54%)

```
Hafiz Shirazi           Rabia al-Adawiyya       Ibn Arabi
al-Ghazali              Jami                    Sanai
Saadi Shirazi           Sarmad Kashani          Makhdoom Bilawal
Pir Meher Ali Shah      Bedil                   Fakhr al-Din Iraqi
Mahmud Shabistari       Shah Nimatullah Wali    Ayn al-Quzat Hamadani
Abu Sa'id Abu'l-Khayr   Nizamuddin Auliya       Ahmad Sirhindi
Shah Waliullah          al-Qushayri             Junayd of Baghdad
Dhul-Nun al-Misri       Bayazid Bastami         Shams-e Tabrizi
Ahmad Ghazali           Hasan al-Basri          Khushal Khan Khattak
```

### Singers Not Referenced By Any Song (27/50 = 54%)

```
Faiz Ali Faiz           Abu Muhammad            Tina Sani
Ghulam Ali              Munshi Raziuddin        Bahauddin Khan
Meraj Ahmed Nizami      Tahira Syed             Rizwan-Muazzam
Attaullah Khan          Akhtar Sharif           Mehr Ali & Sher Ali
Mubarak Ali Khan        Asif Ali Santoo         Mame Khan
Jafar Hussain Badayuni  Ali Haider              Shafqat Amanat Ali
Raees Khan              Hamza Akram             Malika Pukhraj
Sain Akhtar             Zeb Bangash             Abida Hussain
Haji Ghulam Farid Sabri Ustad Bahauddin         Munir Hussain
```

### Concepts Not Referenced By Any Song (18/50 = 36%)

```
Baqa          Shukr         Qawwali (concept)    Kafi (concept)
Qasida        Maqam         Hal                  Sahw
Ilham         Bai'ah        Khanqah              Mazar
Majlis        Diwan         Rubaiyat             Naqshbandi Order
Suhrawardi Order            Mevlevi Order
```

---

## AUDIT 5 — AUTHORITY COVERAGE

### Geographic Coverage Gaps

| Region | Writers | Singers | Assessment |
|---|---|---|---|
| South Asia (Pakistan/India) | Strong | Strong | Core coverage adequate |
| Persia/Iran | Strong (Rumi, Hafiz, Attar, etc.) | **0 singers** | 🔴 No Persian/Iranian singers |
| Turkey/Anatolia | 1 (Yunus Emre) | **0 singers** | 🔴 No Turkish performers |
| Central Asia | 1 (Bedil) | **0 singers** | 🔴 No Central Asian performers |
| North Africa | 0 | 0 | 🔴 Completely absent |
| West Africa | 0 | 0 | 🔴 Completely absent |
| Southeast Asia | 0 | 0 | 🔴 Completely absent |
| Arab World | 5 (early figures) | **0 singers** | 🔴 No Arab Sufi performers |

**Singer dataset is 84% Pakistani, 16% Indian.** This is a severe geographic bias for a database claiming global Sufi authority.

### Missing Major Figures

#### Writers Not In Dataset
```
Omar Khayyam          (Persia — rubaiyat tradition)
Nizami Ganjavi        (Persia — Khamsa)
Bahauddin Naqshband   (Central Asia — Naqshbandi founder)
al-Suhrawardi         (Persia — Illuminationism)
Shah Inayat Qadiri    (Punjab — Bulleh Shah's murshid)
Mir Dard              (Delhi — Urdu Sufi poet)
Ghalib                (Delhi — Sufi-influenced ghazals)
```

#### Singers Not In Dataset
```
Sabri Brothers (as group entity)
Badar Miandad Khan
Aziz Nazan
Alam Lohar (Heer singer)
Any Turkish/Mevlevi performer
Any Persian/Iranian Sufi musician
Any Arab inshad performer
```

### Language Coverage Assessment

| Language | Writers | Songs (by writer language) | Assessment |
|---|---|---|---|
| Persian | 33 writers | ~15 songs | Adequate |
| Arabic | 20 writers | ~3 songs | 🟡 Underrepresented in songs |
| Punjabi | 8 writers | ~30 songs | Strong |
| Sindhi | 4 writers | ~12 songs | Adequate |
| Urdu | 4 writers | ~20 songs | Adequate |
| Saraiki | 2 writers | ~5 songs | Adequate |
| Turkish | 1 writer | 2 songs | 🟡 Minimal |
| Kashmiri | 3 writers | 4 songs | 🟡 Minimal |
| Pashto | 2 writers | 1 song | 🔴 Nearly absent |
| Bengali | 0 | 0 | 🔴 Absent (Lalon Fakir missing) |
| Malay/Indonesian | 0 | 0 | 🔴 Absent |

---

## STRUCTURAL FAILURES SUMMARY

### 1. Missing `seed_sources.json`
**Every source reference in the entire dataset is a phantom.** No actual sources exist.

### 2. Missing `alternateNames[]` on Writer/Singer Schemas
Will cause deduplication failures at scale.

### 3. Missing `attributionStatus` on Song Schema
Cannot distinguish "unknown writer" from "traditional composition" from "disputed authorship."

### 4. Song/Poem Classification Gap
10 literary texts (Rumi's Masnavi opening, Lal Ded's Vakhs, etc.) are stored as "songs" with no singers. These need a separate classification.

### 5. `languageIds[]` and `regionIds[]` are 100% Empty
These critical authority fields were never populated. Seeds for languages and regions were planned (Phase 2A, 2B) but **never created**.

### 6. Duo/Group Entity Problem
Sabri Brothers, Wadali Brothers, Rizwan-Muazzam, Mehr Ali & Sher Ali, Nooran Sisters — some are split into individual entries (Sabri Brothers → 2 entries), others are single entries. No consistent treatment.

---

## ENTITY STATUS

| Category | Count |
|---|---|
| **Verified (structurally complete, no known issues)** | 119 |
| **Questionable (missing attribution, weak biography, or classification issue)** | 118 |
| **Duplicate Candidates (should be merged or resolved)** | 13 songs |

### Breakdown

| Entity Type | Verified | Questionable | Duplicate |
|---|---|---|---|
| Concepts | 50 | 0 | 0 |
| Writers | 23 (referenced by songs) | 27 (orphaned, no song links) | 0 |
| Singers | 8 (with birth year, referenced) | 27 (orphaned) + 15 (no birth year) | 1 pair |
| Songs | 38 (have writer + singer + sources) | 49 (missing writer or weak provenance) | 13 |

---

## HIGH RISK ISSUES

1. **`seed_sources.json` DOES NOT EXIST.** All 250 entities reference phantom sources.
2. **`languageIds` and `regionIds` are 100% empty** across all 250 entities.
3. **8 duplicate pairs** in the songs dataset (13 songs affected).
4. **54% of writers and 54% of singers** are orphaned (not linked to any song).
5. **Geographic bias:** 84% Pakistani / 16% Indian singers. Zero from Iran, Turkey, Arab world, Africa, Southeast Asia.
6. **Schema gaps:** No `alternateNames[]`, no `attributionStatus`, no song/poem distinction.

---

## REQUIRED ACTIONS BEFORE PHASE 3

```
1. CREATE seed_sources.json with all 17 referenced source IDs
2. CREATE seed_languages.json (Phase 2A — never completed)
3. CREATE seed_regions.json (Phase 2B — never completed)
4. RESOLVE 8 duplicate song pairs (merge or differentiate)
5. POPULATE languageIds[] across all entities
6. POPULATE regionIds[] across all entities
7. ADD alternateNames[] to writer and singer schemas
8. ADD attributionStatus to song schema
9. DECIDE: orphaned writers/singers — add songs or remove from gold?
10. DECIDE: geographic scope — global or South Asia focus?
```

---

## REPORT

```
MISSION:
Build Sufi Knowledge Authority Database

PHASE:
Phase 2.3 — Gold Dataset Audit

COMPLETED:
✓ Audit 1 — Duplicate Detection (8 pairs found)
✓ Audit 2 — Attribution Audit (40% songs missing writers, 100% missing language/region)
✓ Audit 3 — Source Quality Audit (0% verifiable — no seed_sources.json)
✓ Audit 4 — Relationship Readiness (NOT READY — 2 of 5 axes completely empty)
✓ Audit 5 — Authority Coverage (severe geographic bias, major figures missing)

FINDINGS:
- Dataset is structurally complete but substantively hollow
- Source provenance is entirely phantom
- Language and region linkages are zero
- 54% of writers and singers are orphaned
- Geographic coverage is Pakistan-centric, not global

HIGH RISK ISSUES:
- seed_sources.json does not exist (all sourceIds are phantom)
- languageIds[] = empty across 250/250 entities
- regionIds[] = empty across 250/250 entities
- 13 songs are duplicates or near-duplicates
- Schema lacks alternateNames[], attributionStatus

ENTITY STATUS:
Verified: 119
Questionable: 118
Duplicate Candidates: 13

SOURCE TIER DISTRIBUTION:
Tier 1: UNKNOWN (sources unresolvable)
Tier 2: UNKNOWN
Tier 3: UNKNOWN
Tier 4: UNKNOWN

SCOPE CHANGES:
0

NEXT PHASE:
Phase 3 — Relationship Graph (BLOCKED — audit failures must be resolved first)

AWAITING INSTRUCTION.
```
