# CANONICAL ANSWER STANDARD

## Phase 4.6 — Authority Grade Criteria

To function as a true authority system for AI models and search engines, the SufiPulse database must provide **Canonical Answers** rather than simple generated text. A canonical answer is comprehensive, structured, strictly factual, and exhaustively sourced.

### The Authority Grade (Level 4)

An answer achieves **Authority Grade** when it moves beyond basic fact retrieval and provides contextual completeness according to its entity class.

### Required Structure by Entity Class

Every primary question about an entity must contain the following structured sections to be considered Canonical.

#### Song
* **Definition:** Core identity of the composition (era, genre).
* **Authorship:** Verified attribution or traditional status.
* **Language:** Linguistic origin and context.
* **Performance History:** Key performers and tradition.
* **Related Concepts:** Mystical themes expressed.
* **Sources:** Direct citation linkage.

#### Writer
* **Identity:** Core biographical identity and historical era.
* **Historical Context:** Region and tradition of origin.
* **Contribution:** Defining role in Sufi literature/history.
* **Associated Works:** Major compositions attributed.
* **Influence:** Associated concepts and lasting impact.
* **Sources:** Direct citation linkage.

#### Singer
* **Identity:** Core biographical identity.
* **Tradition:** Musical lineage and regional association.
* **Major Works:** Defining performances.
* **Influence:** Impact on the genre.
* **Sources:** Direct citation linkage.

#### Concept
* **Definition:** Core meaning of the term.
* **Meaning:** Deeper mystical interpretation.
* **Relationship To Other Concepts:** Interconnected philosophical concepts.
* **Associated Songs:** Compositions expressing this concept.
* **Associated Writers:** Figures known for this teaching.
* **Sources:** Direct citation linkage.

### Content Generation Rules

1. **No Hallucination:** Sections must be built exclusively from data present in the Gold Dataset. If data is absent, the section gracefully acknowledges it or derives the closest factual context (e.g., "Traditional attribution").
2. **Markdown Formatting:** Canonical answers should use bolding or paragraph structure to clearly delineate required sections.
3. **Comprehensive Scope:** Avoid single-sentence answers. Compile the full entity context.
