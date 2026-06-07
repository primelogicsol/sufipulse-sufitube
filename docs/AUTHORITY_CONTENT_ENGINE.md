# AUTHORITY CONTENT ENGINE

## Phase 17B — Governance & Scale Architecture

To protect the intense "Authority Density" established during the foundational architecture phase, SufiPulse institutes a rigorous Content Engine. This engine guarantees that adding thousands of new entities over the coming years will not dilute the institutional quality of the platform. The CMS manages **data and verification**, never visual layout.

---

## 1. Canonical URL Lock

The following namespace is hereby permanently locked. It will not be altered to preserve SEO authority and AI retrieval reliability.

* **Writers:** `/knowledge/writers/[slug]`
* **Songs:** `/knowledge/songs/[slug]`
* **Singers:** `/knowledge/singers/[slug]`
* **Concepts:** `/knowledge/concepts/[slug]`
* **Questions:** `/knowledge/questions/[slug]`

---

## 2. The Entity Lifecycle (Authority Workflow)

No entity may be published without traversing this exact sequence within the CMS:

1. **Draft:** Entity identity created.
2. **Research:** Primary sources gathered and attached.
3. **Verification:** Academic/Historical verification of claims.
4. **Relationship Audit:** Must map to at least 5 other entities (Writer, Song, Concept, etc.) to prevent orphaned data.
5. **Question Generation:** Must generate at least 10 canonical AI-targeted questions.
6. **Authority Review:** Final institutional gatecheck for tone, neutrality, and density.
7. **Published:** Deployed to the public `/knowledge/` graph.

---

## 3. CMS Schema Finalization

The Headless CMS architecture is strictly relational and decoupled from the Next.js UI layer.

### Core Tables
* **Entity Records:** (Song, Writer, Singer, Concept, Question, Source)
* **Relationship Records:** (Writer→Song, Singer→Song, Concept→Song, etc.)
* **Verification Records:** (Verified, Contested, Under Review, Canonical)
* **Publication Records:** (Draft, Research, Review, Published, Archived)

---

## 4. AI Retrieval Layer Architecture

Every intelligence node is architected to be perfectly extracted by Google AI Overviews, ChatGPT, Claude, and Perplexity. The CMS enforces this 5-layer payload structure:

* **Layer 1: Canonical Answer:** The Position-Zero definitive statement.
* **Layer 2: Structured Facts:** Timeline dates, geographic origins, primary lineages.
* **Layer 3: Relationships:** The exact nodes connected via the Unified Knowledge Graph.
* **Layer 4: Evidence:** The institutional archive sources verifying the claims.
* **Layer 5: Related Questions:** The predictive inquiry loops.

---

## 5. The Authority Density Dashboard (Internal)

To monitor the health of the institution at scale, the CMS admin panel must implement the Authority Density Dashboard tracking the following metrics in real-time:

* **Total Entities** (Segmented by type)
* **Total Questions** (Must maintain a high ratio to entities)
* **Total Primary Sources** (The bedrock of the verification layer)
* **Relationship Density** (Average number of edges per node; must remain >5)
* **Authority Density Score** (An aggregate health metric calculating the ratio of Evidence + Relationships vs. Total Entities)
* **Verification Status Distribution** (Monitoring the backlog of 'Under Review' vs. 'Published')
