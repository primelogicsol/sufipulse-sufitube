# KNOWLEDGE INFRASTRUCTURE ARCHITECTURE

## Phase 18A — Advanced CMS Schema & Governance Engine

To successfully scale SufiPulse as an elite knowledge authority, the underlying infrastructure must move beyond basic facts and relationships to support the nuanced realities of historical and academic research.

---

## 1. The Four Advanced Knowledge Layers

### Layer 1: Knowledge Disputes (The Contradiction Engine)
History is rarely unanimous. The infrastructure must natively support conflicting claims without breaking the canonical structure.
* **Schema:** `Dispute Record`
* **Structure:** 
  * `Claim A` + `Evidence A`
  * `Claim B` + `Evidence B`
  * `Institutional Authority Position:` (The verified, canonical stance SufiPulse adopts).

### Layer 2: Source Trust Scoring
Not all evidence is equal. The system must algorithmically weight the authority of incoming facts based on the provenance of the source.
* **Source Types Supported:** Primary Source, Academic Source, Institutional Source, Journalistic Source, Community Source, Oral Tradition.
* **Mechanism:** Every Evidence node is assigned a fundamental `Trust Score`, dictating its visibility and weight in the overall Authority Density calculation.

### Layer 3: Temporal Validity
Facts are not static; they exist within timelines.
* **Mechanism:** Every relationship and structured fact supports `Valid From` and `Valid To` timestamps, allowing the database to accurately reconstruct historical realities without destructively overwriting previous data.

### Layer 4: The Citation Graph
Authority is derived from traceability. 
* **Mechanism:** The schema supports a deep `Citation Lineage` graph (e.g., *Rumi → Masnavi → Nicholson Translation → Academic Paper*). Entities do not just cite sources; they cite the *pathway* of the source.

### Layer 5: Knowledge Confidence Layer
Every individual fact must be scored for confidence, independent of source trust.
* **Mechanism:** A `Confidence Score` tag is assigned to every claim: `[Verified]`, `[High Confidence]`, `[Medium Confidence]`, `[Low Confidence]`, `[Unverified]`, `[Disputed]`.
* **Rationale:** A Primary Source can still produce Low Confidence if conflicting primary sources exist. Conversely, an Oral Tradition can produce High Confidence if dozens of independent chains converge.

---

## 2. The Four Core Registries

To prevent data duplication, resolve fragmentation, and establish a truly relational graph, four first-class registries have been added to the CMS architecture:

### Registry A: The Evidence Registry
* **Purpose:** Evidence is no longer a text field inside a Writer or Song node. Evidence is a standalone, reusable object. 
* **Result:** A single primary manuscript (e.g., *Siyar al-Auliya*) can be linked to 50 different claims across 30 different entities. Updating the manuscript node updates all downstream citations automatically.

### Registry B: The Question Registry
* **Purpose:** Questions are the primary entry point for AI and organic search traffic.
* **Structure:** Questions exist as independent nodes, actively linking to Entities, Relationships, and Evidence. They are treated as the ultimate destination payloads for user queries.

### Registry C: The Verification Registry
* **Purpose:** Absolute institutional accountability.
* **Tracks:** Who verified the claim, the exact timestamp, the methodological standard applied, and the specific `Evidence Node` utilized.

### Registry D: The Alias Registry
* **Purpose:** Resolves duplicate entities, broken relationships, and fragmented SEO caused by transliteration and historical naming variations.
* **Mechanism:** A central clearinghouse where all permutations map to one canonical entity.
* **Example:** `Jalal al-Din Rumi`, `Mawlana Rumi`, `Molana Rumi`, `Mevlana`, and `Mowlana` all strictly route to the single `[Entity: Rumi]` node.

---

## 3. Redefining the Authority Density Score

The previous metric relying strictly on quantity (`>5 relationships`, `>10 questions`) risked incentivizing data bloat over knowledge value.

**The New Algorithmic Standard:**
`Authority Density Score = (Relationship Strength) + (Evidence Trust Quality) + (Verification Integrity) + (Question Coverage) + (Citation Depth)`

The CMS Dashboard will now flag entities not merely for lacking relationships, but for lacking *verified, high-trust* relationships.
