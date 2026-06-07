# HIGH-FIDELITY SCREEN DESIGN: QUESTION INTELLIGENCE

## The Entity: *Who wrote Chaap Tilak?*

This document defines the high-fidelity UI constraints for the Question Intelligence Screen (`/knowledge/questions/[slug]`). This screen is optimized to function as a definitive **Research Answer Page**, designed simultaneously to capture Position-Zero on Google/AI models and deliver an unshakeable sense of institutional authority to human readers.

---

## 1. DESKTOP LAYOUT (4K / Large Display)
**Canvas:** Utilitarian `#FAFAFA` (Research White) to signal clarity and objectivity. Absolute structural precision.

### Exhibit Layer (The Canonical Truth)
* **Spacing:** 100px top padding. Narrow, highly focused reading column (`720px` max-width).
* **Meta Tags:** `11px` Geometric Sans, `#666666`. Floating left.
  * `[ INQUIRY: AUTHORSHIP ]`
* **The Question (Title):** `72px` Editorial Serif, `#111111`. Tight leading.
  * *Who wrote Chaap Tilak?*
* **The Canonical Answer Artifact:** 
  * Instantly beneath the title. Set off by a subtle 1px `#E0E0E0` border or gentle elevation.
  * `28px` Humanist Sans, `#0A0A0A`, `160%` line height.
  * *"Chaap Tilak is a 14th-century devotional poem universally attributed to Amir Khusrau. Modern academic consensus views it as the foundational text establishing the syncretic linguistic identity of early Hindavi Sufi expression."*

### Intelligence Layer (The Research Expansion)
* **Answer Provenance Artifact:**
  * Positioned immediately below the Canonical Answer. Not buried in the Evidence Layer.
  * Structured as a dense, technical metadata block to provide absolute trust.
  * *Answer Status:* Verified Historical Consensus
  * *Derived From:* 7 Sources
  * *Primary Source:* The Siyar al-Auliya
  * *Last Reviewed:* 2026
* **Contextual Nuance:**
  * Expansive paragraphs providing the nuance behind the direct answer (e.g., exploring oral transmission vs. written manuscript history).
* **Focal Entities Panel:**
  * A sticky right-hand column (outside the central reading column) displaying the major entities acting within the answer:
  * `[Entity Card: Amir Khusrau]`
  * `[Entity Card: Chaap Tilak]`

### Evidence Layer (The Trust Trail)
* **Visual Presentation:** A distinct, structured module separating narrative text from academic proof. Background shifts to `#F0F0F2`.
* **The Source Chain:** 
  * Not footnotes. Presented as highly legible "Evidence Plaques."
  * `Citation 1:` The direct manuscript reference.
  * `Citation 2:` Modern academic commentary confirming the attribution.
  * Each plaque contains DOI links, institutional origins, and precise page numbers.

### Discovery Layer (The Inquiry Loop)
* **Further Questions Bank:**
  * Dense, scannable grid of related Canonical Questions.
  * *Why did Khusrau write in Braj Bhasha?*
  * *How did Chaap Tilak shape modern Qawwali?*
* **Discovery Exits:**
  * Clean, prominent navigation pushing the user back into the primary entity hubs (Writer Intelligence, Concept Intelligence).

---

## 2. TABLET LAYOUT (Focused & Linear)
**Canvas:** `48px` side margins.

* **Exhibit Layer:** Question scales to `56px`. The Canonical Answer retains its commanding `28px` size to ensure immediate AI/human parsing.
* **Intelligence Layer:** 
  * The sticky "Focal Entities Panel" drops into the main reading flow, appearing as highly curated interactive inline cards seamlessly integrated after the Context paragraph.
* **Evidence Layer:** The Source Chain switches from horizontal plaques to a structured vertical list optimized for touch interaction.

---

## 3. MOBILE LAYOUT (Answer-First & Scannable)
**Canvas:** `24px` side margins. Edge-to-edge structure.

* **Exhibit Layer:** 
  * Question: `40px`.
  * Canonical Answer dominates the entire viewport (`20px`). The user immediately gets what they came for.
* **Answer Provenance Artifact:** 
  * Condensed to an iconic tag `[ Verified Consensus ]` adjacent to the answer, with the full provenance metadata accessible via a tap.
* **Evidence Layer:** 
  * Immediately beneath the answer, but collapsed: `[ Show 3 Verified Sources ]`. 
  * Tapping smoothly expands the citation plaques without forcing a page load.
* **Discovery Layer:** 
  * Generously sized touch targets for "Related Questions" acting as a continuous, swipeable vertical list. Eliminates dead-ends and captures long-tail curiosity instantly.

---

## 4. CRITICAL DESIGN RULES ENFORCED
* **Not an FAQ:** FAQs imply brief, generic answers to common problems. This is an Institutional Answer. It must feel like reading an excerpt from an authoritative encyclopedia.
* **Position-Zero Architecture:** The Canonical Answer Artifact is structurally isolated from the surrounding context so that downstream APIs, crawler bots, and LLMs can perfectly extract the truth without parsing decorative UI wrappers.
* **Consensus Signaling:** By explicitly declaring "Verified Consensus" or "Active Scholarly Debate" instead of a progress bar or gauge, the interface silently communicates to the user that SufiPulse grades its own knowledge, instantly elevating its perceived trustworthiness above community wikis.
