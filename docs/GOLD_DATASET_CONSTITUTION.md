# GOLD DATASET CONSTITUTION

## SufiPulse Knowledge Authority Database — Ground Truth Dataset v1

> **Purpose:** Define the exact standards for the first authoritative dataset.
> This dataset becomes the Ground Truth. Everything else is measured against it.

---

## Gold Dataset Scope

### Writers

```
Target: 50
```

Only historically significant and well-documented figures.

Candidates:

```
Rumi
Amir Khusrau
Bulleh Shah
Sultan Bahoo
Shah Abdul Latif Bhittai
Lal Ded
Nund Rishi (Sheikh ul-Alam)
Khawaja Ghulam Farid
Sachal Sarmast
Waris Shah
Shah Hussain
Baba Farid (Fariduddin Ganjshakar)
Hafiz Shirazi
Yunus Emre
Mansur al-Hallaj
Rabia al-Adawiyya
Ibn Arabi
Al-Ghazali
Jami
Attar of Nishapur
Sanai of Ghazna
Saadi Shirazi
Rahman Baba
Mian Muhammad Bakhsh
Kabir
Hamza Makhdoom
Sarmad Kashani
Makhdoom Bilawal
Pir Meher Ali Shah
Qalandar Lal Shahbaz (attributed poetry)
Bedil
Baba Bulleh Shah
Khushal Khan Khattak
Ahmad Ghazali
Fakhr al-Din Iraqi
Mahmud Shabistari
Shah Nimatullah Wali
Ayn al-Quzat Hamadani
Abu Sa'id Abu'l-Khayr
Bayazid Bastami (attributed sayings)
Dhul-Nun al-Misri
Junayd of Baghdad
Shibli
Hasan al-Basri
Abdul Qadir Gilani
Moinuddin Chishti (attributed poetry)
Nizamuddin Auliya (attributed poetry)
Bahauddin Naqshband (attributed sayings)
Ahmad Sirhindi
Shah Waliullah
```

### Singers

```
Target: 50
```

Only verifiable performers with documented discographies.

Candidates:

```
Nusrat Fateh Ali Khan
Abida Parveen
Ghulam Farid Sabri (Sabri Brothers)
Maqbool Ahmed Sabri (Sabri Brothers)
Aziz Mian Qawwal
Rahat Fateh Ali Khan
Pathanay Khan
Faiz Ali Faiz
Amjad Sabri
Fareed Ayaz
Abu Muhammad
Puran Chand Wadali (Wadali Brothers)
Pyare Lal Wadali (Wadali Brothers)
Reshma
Allan Faqir
Sain Zahoor
Sanam Marvi
Tina Sani
Nayyara Noor
Mehdi Hassan
Ghulam Ali
Munshi Raziuddin Qawwal
Bahauddin Khan Qawwal
Meraj Ahmed Nizami
Tahira Syed
Rizwan Muazzam
Ustad Bahauddin Qawwal
Jafar Hussain Badayuni
Hamza Abbas
Sher Miandad Khan
Akhtar Sharif
Mubarak Ali Khan
Mehr Ali & Sher Ali
Raees Khan Qawwal
Haji Ghulam Farid Sabri
Munir Hussain Qawwal
Ali Haider
Sain Akhtar
Ustad Nusrat Fateh Ali Khan Party
Qawwal Bahauddin Khan & Party
Sher Ali Mehr Ali
Asif Ali Santoo Khan
Arif Feroz Qawwal
Nooran Sisters (Jyoti & Sultana)
Attaullah Khan Esakhelvi
Saeen Akhtar
Mukhtiar Ali
Mame Khan
Abida Hussain
Saieen Zahoor Ahmad
```

### Songs

```
Target: 100
```

Only songs where the following are fully known:

```
Writer
Singer (at least one recorded performance)
Language
Sources (minimum 3)
```

No incomplete entries permitted.

### Concepts

```
Target: 50
```

Only foundational concepts with academic definitions.

Candidates:

```
Ishq (Divine Love)
Fana (Annihilation of the Self)
Baqa (Subsistence in God)
Dhikr / Zikr (Remembrance of God)
Tawhid (Divine Unity)
Sabr (Patience)
Shukr (Gratitude)
Faqr (Spiritual Poverty)
Muraqaba (Meditation / Contemplation)
Nafs (Ego / Self)
Sama (Spiritual Listening / Audition)
Wilayah (Sainthood / Proximity to God)
Qawwali (Devotional Music Form)
Kafi (Poetic Form)
Ghazal (Lyric Poetry Form)
Hamd (Praise of God)
Naat (Praise of the Prophet)
Qasida (Ode Form)
Silsila (Spiritual Chain)
Tariqa (Spiritual Path)
Haqiqa (Inner Truth)
Sharia (Sacred Law)
Marifa (Gnosis / Direct Knowledge)
Maqam (Spiritual Station)
Hal (Spiritual State)
Wajd (Ecstasy)
Sukr (Spiritual Intoxication)
Sahw (Spiritual Sobriety)
Qurb (Nearness to God)
Kashf (Unveiling / Mystical Insight)
Ilham (Inspiration)
Murshid (Spiritual Guide)
Murid (Disciple)
Bai'ah (Oath of Allegiance)
Khanqah (Sufi Lodge)
Dargah (Shrine)
Mazar (Tomb / Shrine)
Urs (Death Anniversary Celebration)
Majlis (Assembly / Gathering)
Diwan (Collected Poetry)
Masnavi (Rhyming Couplet Form)
Rubaiyat (Quatrain Form)
Chishti Order
Qadiri Order
Naqshbandi Order
Suhrawardi Order
Mevlevi Order
Tawakkul (Trust in God)
Rida (Contentment with God's Will)
Tajalli (Divine Self-Disclosure)
```

---

## Verification Standard

Every Gold Dataset entity must contain:

```
Minimum 3 independent sources
```

Example:

```
Source A: Academic book or journal
Source B: Encyclopedia or reference work
Source C: Independent verification (different author, different publication)
```

All three sources must be:

```
- From approved source classes (per SOURCE_UNIVERSE.md)
- At least one from Tier 1 (Academic Books, Journals, Archives)
- Independently authored (no circular references)
- Published (not draft, not self-published blogs)
```

---

## Rejection Rules

Do not ingest if:

```
- Less than 3 independent sources
- Conflicting identity (disputed authorship, contested attribution)
- Unknown authorship (anonymous works without scholarly consensus)
- Unverified attribution (tradition-only attribution without academic support)
- Duplicate of existing entity (same person/song under different name)
```

Entities that fail verification but are potentially valid:

```
Mark as: status = "pending_verification"
```

Do not mark as "published" until all verification criteria are met.

---

## Entity Quality Gates

### Writer Quality Gate

```
✓ Full name verified (minimum 2 sources)
✓ Biographical dates verified or scholarly consensus noted
✓ Primary language(s) verified
✓ Region/geographic association verified
✓ At least one known work attributed with source
✓ Sufi order affiliation verified (if claimed)
✓ No conflation with different historical figure
✓ 3 independent sources present
```

### Singer Quality Gate

```
✓ Full name verified
✓ Country and region verified
✓ Birth year verified (or approximate with source)
✓ At least one recorded performance verifiable
✓ Genre/tradition verified
✓ No conflation with different performer
✓ 3 independent sources present
```

### Song Quality Gate

```
✓ Title verified (including alternate titles)
✓ Writer attribution verified with source
✓ At least one singer performance documented
✓ Language verified
✓ Genre classification verified
✓ No conflation with different composition
✓ 3 independent sources present
```

### Concept Quality Gate

```
✓ Term verified in original language
✓ Academic definition sourced
✓ Usage in Sufi tradition documented
✓ No conflation with unrelated Islamic/philosophical term
✓ 2+ independent sources present (concepts require minimum 2)
```

---

## Gold Dataset File Deliverables

After this constitution is approved, create only:

```
gold_writers.json      (50 entries)
gold_singers.json      (50 entries)
gold_songs.json        (100 entries)
gold_concepts.json     (50 entries)
```

No other datasets.
No bulk ingestion.
No subagents.

---

## Trust Inheritance Rule

```
If the first 250 entities are exceptionally accurate:

  50 Writers
  50 Singers
  100 Songs
  50 Concepts

Then the entire future authority database inherits trust.

If the first dataset is weak,
every future expansion becomes questionable.
```

---

## Authority Formula

```
Authority ≠ Entity Count
Authority = Verified Entity Count × Source Depth × Independence
```
