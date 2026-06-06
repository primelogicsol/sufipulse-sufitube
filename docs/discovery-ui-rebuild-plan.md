# SufiPulse Discovery UI Rebuild Plan

**Objective:** Transform the Discovery frontend from a static directory into an intelligent, premium global Sufi music discovery platform akin to Spotify, Google Arts & Culture, and IMDb.

---

## 1. Hub Page Rebuild (`/discovery/page.tsx`)

### The Hero Intelligence Layer
- Replace static text with a massive, cinematic hero section.
- Implement a functional, central **Global Search Bar**.
- Below the search, add **Quick Intent Chips** (horizontal scrollable on mobile): *Sufi Songs, Qawwali, Sufi Singers, Sufi Saints, Sufi Poetry, Sufi Albums, Kashmiri Sufiyana, Urdu Sufi Music, Punjabi Sufi Music*.

### The Discovery Builder Panel
- Build an interactive filter interface.
- Filters:
  - **Entity Type:** Song, Singer, Saint, Poet, Album, Tradition, Concept, Region.
  - **Region:** Kashmir, Pakistan, India, Turkey, Iran, Central Asia, Middle East, Diaspora.
  - **Language:** Urdu, Punjabi, Kashmiri, Persian, Arabic, Turkish, Sindhi, Hindi.
  - **Tradition:** Qawwali, Sama, Kafi, Sufiyana, Chishti, Rishi, Mevlevi, Qadiri.
  - **Intent:** Listen, Learn, Read, Watch, Discover.
- This will require state management (React `useState` / URL query params) to filter the rendered entities dynamically.

### Premium Cluster Editorial Blocks
- Remove the hardcoded "Nund Rishi" card.
- Build a map over completed clusters:
  - **Cluster 01:** Nund Rishi and the Soul of Kashmir
  - **Cluster 02:** Qawwali: The Sound of Devotional Ecstasy
  - **Cluster 03:** Nusrat Fateh Ali Khan and the Globalization of Qawwali
- Each block must dynamically render connected Releases, Publications, Videos, and Nodes with a primary "Explore Cluster" CTA.

### Featured Authority Pathways
- Create visually striking pathway cards: "Start with Qawwali", "Explore Sufi Singers", etc.
- These pathways will act as guided tours into specific entity collections.

### Smart Result Cards
- Upgrade generic cards to show: Name, Type, Region, Tradition, "Why it matters" excerpt, Connected Release status, and specific action intent (Read/Watch/Listen).

---

## 2. Entity Profile Rebuild (`/discovery/[entityType]/[slug]/page.tsx`)

### The Intelligence Hero
- Remove the basic layout. Use a split hero: prominent typography for Name, Type, Region, and Tradition, paired with an immediate primary action (e.g., "Explore Release" or "Watch Performance").

### Editorial Knowledge Section
- Replace the primitive `split('\n\n')` parser with `react-markdown` or a robust custom tailwind typography parser.
- Style headers, blockquotes, and lists elegantly.

### Visual Influence Network
- Replace the raw grid of names with a premium visual network map, or highly styled connection cards.
- Ensure pluralization routing is robust (e.g., a mapping object that translates `artist` to `singers`).

### The SufiPulse Interpretation
- The anchor of the page. Display highly polished cards for connected Releases, Publications, and Videos.
- Seamlessly integrate the SufiPulse-USA subscription and follow CTAs.

---

## 3. Global Search & State Implementation

- Create a client-side search utility or API endpoint that queries the `entityStore` and `articles` data.
- Search must match against: `canonicalName`, `alternateNames`, `tags`, `shortDescription`, `entityType`.

---

## 4. Execution Sequence

1. **Phase 1: Architecture & Utilities**
   - Implement the URL slug pluralization map.
   - Install/configure a proper markdown parser.
2. **Phase 2: The Hub Page**
   - Build the Hero, Search Bar, Intent Chips, and Discovery Builder Panel.
   - Build the Premium Cluster Editorial blocks.
3. **Phase 3: The Entity Page**
   - Rebuild the Hero, Knowledge Summary, Influence Network, and Interpretation anchors.
4. **Phase 4: Polish & Audit**
   - Mobile responsive checks, hover state animations, and dead-link elimination.
