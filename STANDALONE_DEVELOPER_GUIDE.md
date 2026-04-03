# Standalone Developer Guide

## Purpose
This guide explains how to keep SufiPulse fully standalone (no external database service) and when it is safe to remove Supabase from the codebase.

---

## 1. What standalone means in this project

Standalone mode in SufiPulse means:

- The app runs without Supabase credentials.
- Persistence is handled by browser localStorage.
- Core data flow uses the local storage service.

Primary standalone storage layer:

- app/lib/storage.ts

Optional backend path (separate mode):

- backend/New folder (2)/ (Express + PostgreSQL)

---

## 2. Rules to keep project standalone

Follow these rules for all new code:

1. Do not add runtime imports from @supabase/supabase-js in app code.
2. Do not create required env dependencies on NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Use app/lib/storage.ts for persistence in standalone UI flows.
4. If adding a new feature, implement localStorage persistence first.
5. Keep all Supabase references optional or behind explicit non-standalone mode checks.
6. Ensure pages still work when Supabase env vars are not set.

---

## 3. Current Supabase touchpoints to watch

At time of writing, these files contain active runtime Supabase usage:

- app/lib/supabase-client.ts
- app/admin/youtube-sync/page.tsx

Most other Supabase mentions are in docs or commented code.

---

## 4. When should Supabase be deleted?

Delete Supabase only after all conditions below are true:

1. No production feature depends on app/lib/supabase-client.ts.
2. No active import of supabase client remains in app runtime code.
3. YouTube sync uses internal API/storage/backend instead of Supabase.
4. Typecheck and build pass without @supabase/supabase-js installed.
5. Standalone smoke tests pass on key flows.

If any of the above is false, do not delete Supabase yet.

---

## 5. Safe deletion checklist

Run this checklist in order.

### A. Replace runtime dependencies first

1. Refactor app/admin/youtube-sync/page.tsx to write through internal API/service.
2. Remove usage of app/lib/supabase-client.ts from runtime code.

### B. Confirm no active runtime references

Use workspace search for:

- @supabase/supabase-js
- from '../../lib/supabase-client'
- from '@/app/lib/supabase-client'
- supabase.

Only docs/comments may remain.

### C. Remove Supabase runtime pieces

1. Remove app/lib/supabase-client.ts (after zero runtime imports).
2. Remove @supabase/supabase-js from package.json.
3. Run npm install.

### D. Validate application

Run:

- npm run type-check
- npm run build

Then smoke test:

1. Auth/login (standalone flow)
2. Admin dashboard data visibility
3. Profile creation/update flows
4. CMS release create/edit/save
5. Contact form and admin contact inbox
6. Any payment/adoption flow used in your deployment

---

## 6. What not to delete if you still want PostgreSQL option

You can remove Supabase and still keep PostgreSQL support through your own backend.

Keep:

- backend/New folder (2)/
- PostgreSQL schema files under supabase/migrations/ if you want to reuse SQL on your own Postgres

Those SQL files are your schema assets and are not tied only to Supabase hosting.

---

## 7. Recommended team policy

1. Default mode for development: standalone localStorage.
2. Any new external dependency must be optional unless approved.
3. Before each release, verify app behavior with no Supabase env vars.
4. If switching to backend mode, do it explicitly and document the mode in release notes.

---

## 8. Quick decision table

- Need fastest local development with no external services: keep standalone mode.
- Need shared persistent multi-user production DB: use backend PostgreSQL mode (or Supabase if intentionally chosen).
- Want to remove Supabase package safely: do it only after Section 5 checklist is fully complete.
