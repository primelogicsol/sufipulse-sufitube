# HIGH-FIDELITY SCREEN DESIGN: SONG INTELLIGENCE

## The Entity: *Chaap Tilak*

This document translates abstract architecture into exact visual specifications. It acts as the definitive high-fidelity handoff for the Song Intelligence Screen.

---

## 1. DESKTOP LAYOUT (4K / Large Display)
**Canvas:** Infinite scroll, `#FBF9F6` (Parchment White) background to evoke a museum gallery wall. 

### Exhibit Layer (The Hero)
* **Spacing:** 120px top padding.
* **Meta Tags:** `12px` Geometric Sans, `#6B655C` (Muted Ink). Floating left. 
  * `[ 14TH CENTURY ] • [ QAWWALI TRADITION ] • [ BRAJ BHASHA ]`
* **Title:** `120px` Display Serif (e.g., *Playfair Display* or *Garamond*), `#1A1815` (Deep Charcoal). Centered.
  * `Chaap Tilak`
* **Canonical Answer Artifact:** 
  * Positioned dead center below the title. Max-width `800px`.
  * `24px` Editorial Serif, `160%` line height. 
  * *"A foundational Sufi devotional composition traditionally attributed to Amir Khusrau, expressing absolute spiritual surrender (Fana) through the metaphor of bridal adornment."*

### Intelligence Layer (The Dual-Column Layout)
* **Grid Layout:** 60/40 Asymmetric split.
* **Left Column (Context & Meaning):**
  * `32px` Header: *"The Architecture of Surrender"*
  * `18px` Body text, `#2C2A26`. Expansive paragraphs explaining the lyrical metaphor.
  * **Lyric Module:** Inset block. `#F2EFE9` background. Original Braj Bhasha in italic serif left; English translation right.
* **Right Column (Relationship Constellation):**
  * A floating, sticky module as the user scrolls.
  * Visual: Deep space `#111111` canvas inside a softly rounded artifact card.
  * Node 1 (Center): `Chaap Tilak`
  * Edge up: `Amir Khusrau` (Glowing node).
  * Edge right: `Ishq` & `Fana` (Concept nodes).
  * Hovering any node softly highlights the path and dims the rest.

### Evidence Layer (The Archive Drawer)
* **Visual Shift:** Background transitions smoothly to `#EAE6DD` (Stone).
* **Archive Plaques:** Arranged in a 3-column horizontal masonry grid.
* **Plaque Design:** Deep shadows, `#FFFFFF` surface. Serif titles.
  * Example: `[Primary Source] The Siyar al-Auliya (1388)`
  * Contains exact page/line references verifying Khusrau's authorship.

### Discovery Layer (The Infinite Loop)
* **Layout:** A horizontal, edge-to-edge carousel of Knowledge Artifact Cards.
* **Cards:** Distinct physical elevation. Image-free, typography-driven.
  * Card 1: `Writer: Amir Khusrau`
  * Card 2: `Concept: Fana (Annihilation)`
  * Card 3: `Performance: Abida Parveen (1998)`

---

## 2. TABLET LAYOUT (Balanced)
**Canvas:** Fluid width, side-margins `48px`.

* **Exhibit Layer:** Title scales down to `80px`. Meta tags stack above the title. Canonical Answer scales to `20px` to maintain 3-second readability.
* **Intelligence Layer:** 
  * Layout shifts to a single, centered column (`600px` max-width) for the reading experience.
  * **Relationship Constellation:** No longer sticky. It is injected seamlessly as a full-width interactive break immediately after the Canonical Answer, acting as a visual breather before the deep context text begins.
* **Evidence Layer:** Archive Plaques shift from 3-columns to a 2-column grid.
* **Discovery Layer:** Knowledge Artifact cards scale to fill 50% width, allowing two to be visible at a time.

---

## 3. MOBILE LAYOUT (Answer-First)
**Canvas:** Edge-to-edge, side-margins `24px`.

* **Exhibit Layer:** 
  * Title: `48px`. 
  * Canonical Answer dominates the entire viewport upon load (`18px` serif). 
* **Relationship Layer (Forced Priority):** 
  * Complex node-graphs fail on mobile. 
  * Constellation shifts to **"Lineage Tags"**: Pill-shaped interactive chips immediately beneath the Canonical Answer. 
  * `[ Writer: Amir Khusrau → ]` `[ Concept: Fana → ]`
* **Intelligence Layer:** 
  * Strict vertical scroll. Lyrics stack natively (Original text above, Translation below in a slightly darker inset block).
* **Evidence Layer:** 
  * Collapsed by default to save space. 
  * UI: `[ + View 4 Academic Sources ]`. Tapping expands the Archive Drawer smoothly downwards.
* **Discovery Layer:** 
  * Single vertical stack of large, tap-friendly Knowledge Cards, ensuring the user hits an onward journey at the exact moment they finish the article.

---

## 4. BEHAVIOR & INTERACTION NOTES

### Relationship Behavior (The "Alive" Test)
The Constellation is not static. When a user lands on *Chaap Tilak*, the constellation slowly breathes—edges pulsing slightly. If the user scrolls past the constellation on Tablet, it shrinks into a mini-map locked to the bottom right of the screen, allowing them to jump to *Amir Khusrau* instantly without scrolling back up.

### Evidence Behavior (The "Prestigious" Test)
Sources do not look like footnotes `[1]`. They act like museum placards. Hovering over a claim in the text (e.g., "traditionally attributed") draws a delicate, curved SVG line connecting the text directly to the Evidence Plaque in the margin (on desktop).

### Discovery Behavior (The "No Instruction" Test)
As the user nears the bottom of the lyrics, the Discovery Layer does not say "Read More." It says:
*Explore the architect of this song:* followed by the Amir Khusrau artifact. The transition is thematic, not random.
