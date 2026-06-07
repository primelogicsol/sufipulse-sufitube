# QUESTION ARCHITECTURE

## Phase 4.0 — Canonical Question Model

This document defines the strictly approved question classes that form the Question & Answer Knowledge Layer of the SufiPulse Authority Database. No other question classes are permitted without explicit approval.

### Approved Question Classes

| Class | Definition | Example |
|---|---|---|
| **Definition** | Queries seeking the core meaning or foundational explanation of a concept, term, or entity. | *What is Fana?* |
| **Identity** | Queries seeking biographical or historical identification of a person or group. | *Who was Amir Khusrau?* |
| **Authorship** | Queries establishing the creator, writer, or origin of a composition or text. | *Who wrote Chaap Tilak?* |
| **Meaning** | Queries exploring the thematic, lyrical, or mystical interpretation of a work. | *What does Chaap Tilak mean?* |
| **Language** | Queries identifying the linguistic origin or primary language of an entity or composition. | *Which language is Chaap Tilak in?* |
| **Origin** | Queries establishing geographic, cultural, or historical provenance. | *Where was Shah Abdul Latif Bhittai from?* |
| **Relationship** | Queries mapping the connection between two distinct entities or concepts. | *How is Fana related to Baqa?* |
| **Performance** | Queries identifying who has sung, recited, or recorded a specific composition. | *Who sings Dama Dam Mast Qalandar?* |
| **Album** | Queries establishing discography context. | *Which album features Mustt Mustt?* |
| **Concept** | Queries linking a composition or person to a broader philosophical idea. | *What concepts are expressed in Bulla Ki Jaana?* |
| **Influence** | Queries mapping the historical or artistic impact of one entity upon another. | *Who influenced the poetry of Bulleh Shah?* |
| **Comparison** | Queries distinguishing or finding parallels between two entities. | *What is the difference between Qawwali and Kafi?* |

### Forbidden Classes

* **Subjective / Opinion:** *Who is the best Qawwal?*
* **Predictive:** *Will Sufi music become more popular?*
* **Transactional:** *Where can I buy Nusrat Fateh Ali Khan's music?*
* **Unverifiable:** *Did Rumi actually meet Shams in a tavern?*

### Linkage Requirement

Every question must rigidly map to the canonical schema defined in `ANSWER_STANDARD.md`. An orphaned question without verifiable `entityIds` or `sourceIds` is invalid.
