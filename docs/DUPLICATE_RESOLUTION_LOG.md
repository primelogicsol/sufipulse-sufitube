# DUPLICATE RESOLUTION LOG

## Phase 2.5 — Step 4

| Action | Source | Target | Reason |
|---|---|---|---|
| MERGE | song_000072 "Tera Ishq Nachaaya" | → song_000007 "Tere Ishq Nachaya" | Same kafi by Bulleh Shah, variant spelling. SingerIds, alternateTitles, conceptIds, sourceIds merged into target. |
| MERGE | song_000090 "Ki Jaana Main Kaun" | → song_000008 "Bulla Ki Jaana Main Kaun" | Same kafi by Bulleh Shah, variant title. All data merged into target. |
| MERGE | song_000079 "Dam Mast Qalandar (NFAK)" | → song_000005 "Dama Dam Mast Qalandar" | Same composition, different performer label. NFAK already listed as singer in target. |
| MERGE | song_000060 "O Lal Meri" | → song_000059 "Lal Meri Pat Rakhiyo" | Same Qalandar devotional, variant opening. SingerIds merged into target. |
| DISTINCT | song_000005 "Dama Dam Mast Qalandar" | — | Specific devotional song with lyrics beginning "Dama dam mast qalandar" |
| DISTINCT | song_000020 "Shahbaz Qalandar" | — | Broader manqabat tradition praising Shahbaz Qalandar, distinct lyrical content |
| DISTINCT | song_000014 "Lagi Bina" | — | Shah Hussain kafi beginning "Lagi bina taar rabab di". Removed "Rang" from alternateTitles. |
| DISTINCT | song_000034 "Rang" | — | Shah Hussain kafi about Basant beginning "Rang kali kooch rang de" |
| DISTINCT | song_000006 "Allah Hu" | — | Extended dhikr composition with improvisational elaboration |
| DISTINCT | song_000017 "Allah Hoo Allah Hoo" | — | Structured repetitive dhikr, distinct arrangement |
| PENDING | song_000005, song_000059 | — | May share lyrical content in some regional traditions. Kept separate pending source verification. |

## Summary

```
Merged: 4
Differentiated: 6
Pending Review: 1 pair
Songs removed: 4
Songs added: 34 (new songs linking orphaned entities)
Net song count: 134 (was 100)
```
