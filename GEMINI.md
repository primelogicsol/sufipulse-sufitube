# SufiPulse — Project Instructions & Architecture Baselines

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
- **Phase:** Quiet Internal Maturation.
- **Focus:** Stabilization, monitoring, and internal tool refinement. Avoid broad architectural changes or public feature releases in the immediate window.
