# SufiPulse — Project Instructions & Architecture Baselines

> **MANDATORY GOVERNANCE:** All AI agents, developers, and CMS operators must adhere to the `docs/discovery-mission-doctrine.md` before proposing architecture, content, SEO, or graph changes.
> **Primary Mission:** SufiPulse Discovery exists to capture global search demand related to Sufism and Sufi culture and convert that demand into authority, traffic, engagement, and audience growth for SufiPulse.com and the SufiPulse-USA YouTube channel. **Discovery is not an encyclopedia; it is a global SEO Capture Engine.** 

## Core Architecture Posture

### Public Sponsorship Engine (Managed Path)
- **Status:** Stable and Primary.
- **Mechanism:** "Managed by SufiPulse" is the canonical sponsorship route for the public.
- **Guest Tracking:** Anonymous sponsors are routed to `/adopt-song/request/[id]?token=[trackingToken]` for status tracking.
- **Stripe Integration:** Uses Tier-based Stripe Payment Links. Fallback is `manual_coordination` if links are missing.

### Google Ads Direct (Quarantined)
- **Status:** Internal/Admin Only.
- **Posture:** Securely quarantined behind feature flags and auth loading guards in `AdoptTab.tsx`.
- **Public Copy:** Professional "Infrastructure Enhancement" message displayed to public users.
- **Development Rule:** Do NOT expose Google Ads Direct publicly without explicit directive. Focus on "Quiet Internal Maturation" (admin tooling, diagnostics).

## Engineering Standards

### State Stability & Hydration
- **Anti-Flip Guards:** Components (like `AdoptTab`) must wait for `authLoading` and API configuration resolution before rendering interactive CTAs to prevent visual flips.
- **SSR Boundaries:** Heavy interactive components are loaded via `next/dynamic` with `ssr: false` to maintain stable SSR skeletons.

### Security & Access Control
- **Tracking Tokens:** Access to specific adoption/sponsorship requests requires a valid `trackingToken` for non-authenticated users.
- **Stripe Safety:** `test_` payment links are strictly blocked in production but allowed in development.

## Strategic Direction
- **Phase:** Production Focus (Post-Architecture Freeze).
- **Focus:** The Discovery Engine, Authority Framework, Conversion Architecture, and Strategic Scoring System are 🏆 FROZEN. No new major architectural changes until the first 10 flagship releases, 10 flagship publications, and 10 flagship videos are fully produced.
- **Future Roadmap:** Post-production, the next architectural enhancement will be the `Citation Center` (/discovery/citations) to aggregate books, academic sources, and historical records for AI trust and researcher citations.

## Atlas Engine Principles

### Principle: Capture The Entire Sufi Universe
**Capture first. Prioritize second. Convert third.**
The graph should never ask "Does this help SufiPulse today?" It should ask "Is this part of the Sufi universe?" If yes: Store it, classify it, score it, then decide its status (Publish, Review, Reference Only, Production Candidate, Archive). This ensures SufiPulse scales to become the Wikipedia of Sufi music without losing the conversion discipline of a production studio.

### SufiPulse Production Doctrine
Every flagship release must accomplish five goals simultaneously:
1. Teach something historically accurate.
2. Preserve something culturally valuable.
3. Interpret something through the SufiPulse lens.
4. Connect readers to the wider Sufi knowledge graph.
5. Inspire engagement with original SufiPulse content.

### The True Objective: Global SEO Capture Engine
SufiPulse Discovery is not merely an archive; it is a **massive SEO and AI-search traffic engine**.
**Mission Statement:** SufiPulse Discovery exists to capture global search demand around Sufism, Sufi music, Sufi poetry, Sufi singers, Sufi albums, saints, songs, and traditions, then convert that traffic into SufiPulse.com authority and SufiPulse-USA YouTube viewership.

**The Conversion Formula:**
1. User searches popular Sufi topic (e.g., Qawwali, Nund Rishi)
2. Google / AI / browser finds SufiPulse Discovery
3. User lands on SufiPulse.com
4. User explores release / article / interpretation
5. User watches SufiPulse-USA
6. Views, subscribers, authority grow


### Canonical Title Authority (A/B Testing Governance)
A/B testing on external platforms (like YouTube) may optimize packaging, but it **may never experiment with the canonical identity of the song**. 

**The Rule:**
- Canonical song title = permanent identity.
- YouTube Variant A = global default publishing title and closest public-facing form of the canonical title.
- Variant B = same core title + emotional/search qualifier.
- Variant C = same core title + genre/theme/discovery qualifier.
- All three variants must begin with the exact same canonical song title.

**Data Model Architecture:**
```text
canonicalTitle
youtubeTitle
youtubeTitleVariantA
youtubeTitleVariantB
youtubeTitleVariantC
youtubeWinningVariant
youtubeTitleLastSyncedAt
```

**Publishing Rule:**
- SufiPulse.com release card, H1, SEO <title>, OpenGraph, JSON-LD, internal search, and slug identity MUST use `canonicalTitle` / Variant A identity.
- YouTube experiments with A/B/C variants.
- The Winning YouTube variant updates `youtubeTitle` but **DOES NOT** overwrite `canonicalTitle`.


The title-governance architecture is a frozen governance invariant requiring an explicit architecture revision to change.
