# SufiPulse Release Delivery Execution Checklist

Status: Ready for engineering execution
Date: 2026-04-03
Based on: CMS_RELEASE_DELIVERY_SPEC.md

## 1) Delivery Scope

This checklist maps the release delivery specification to concrete modules, implementation tasks, and rollout order.

Outcome target:

1. Canonical CMS release model drives web rendering.
2. Slug-first public resolution is enforced.
3. YouTube sync and manual export both operate from one subtitle source.
4. QA can see fallback source and per-language delivery states.

## 2) Current Gap Report

### Already implemented

1. Subtitle export API boundary exists.
- app/api/releases/[id]/subtitles/route.ts

2. YouTube subtitle sync API boundary exists.
- app/api/releases/[id]/youtube-subtitles/route.ts

3. Release editor has YouTube sync actions and auto-sync toggle.
- app/admin/cms-releases/[id]/page.tsx

4. Canonical release model already includes subtitle governance and sync metadata.
- lib/cms-storage.ts

5. Public release page already supports channel override precedence and subscribe behavior.
- app/(public)/release-detail/[slug]/page.tsx

### Partially implemented

1. Public detail route uses fallback chain where slug path may still resolve by youtubeId-first behavior.
- app/(public)/release-detail/[slug]/page.tsx

2. Split persistence conventions still exist in parallel modules.
- lib/cms-storage.ts
- lib/cms-api.ts

3. Legacy YouTube sync path still bypasses release-domain API flow.
- app/admin/youtube-sync/page.tsx

4. Per-language sync states exist for automatic sync metadata but manual upload states are not complete.
- lib/cms-storage.ts
- app/admin/cms-releases/[id]/page.tsx

### Missing

1. Hard identity constraints enforcement for slug and youtubeId uniqueness.
2. Manual upload pending/completed state operations in delivery UI.
3. Fallback source telemetry surfaced for QA.
4. One-time migration utility from legacy release storage key to canonical key.

## 3) Phase 1 Tasks (Contract Hardening)

### 3.1 Enforce slug-first public resolution

Files:

1. app/(public)/release-detail/[slug]/page.tsx
2. app/api/releases/route.ts

Tasks:

1. Resolve release by slug first.
2. Keep youtubeId compatibility lookup as secondary only.
3. Add explicit resolutionSource state in client data model:
- cms_slug
- cms_youtube_compat
- external_youtube_fallback
4. Expose resolution source in hidden QA marker and console/debug log.

Acceptance:

1. Opening /release-detail/<slug> no longer treats slug as youtubeId primary key.
2. Compatibility path remains available for existing shared links.

### 3.2 Enforce hard identity constraints

Files:

1. app/api/releases/route.ts
2. app/api/releases/[id]/route.ts
3. lib/cms-storage.ts

Tasks:

1. On create and update, reject duplicate slug.
2. On create and update, reject duplicate youtubeId when provided.
3. Allow missing youtubeId only for explicitly web-only release mode.
4. Return structured validation errors for admin UI.

Acceptance:

1. Duplicate slug/youtubeId attempts return 409 conflict with clear message.
2. Existing valid records continue to load.

### 3.3 Unify canonical release persistence behavior

Files:

1. lib/cms-storage.ts
2. lib/cms-api.ts

Tasks:

1. Keep one canonical release store key in cms-storage.
2. Refactor cms-api release CRUD calls to use canonical release domain behavior.
3. Add one-time migration from legacy cms_releases key to canonical key.
4. Write migration marker key and skip repeated migrations.

Acceptance:

1. New writes occur only through canonical release store.
2. Existing standalone data is migrated once without data loss.

## 4) Phase 2 Tasks (Delivery Panel Completion)

### 4.1 Add per-language delivery state model

Files:

1. lib/cms-storage.ts
2. app/admin/cms-releases/[id]/page.tsx

Tasks:

1. Extend release model with per-language delivery state map.
2. Add states:
- web_only
- synced_to_youtube
- manual_upload_pending
- manual_upload_completed
- sync_failed
3. Track actor and timestamp for manual completion.
4. Preserve sync metadata for API-synced tracks.

Acceptance:

1. Delivery state visible and editable in release editor.
2. State transitions are logged and persisted.

### 4.2 Add manual upload fallback controls

Files:

1. app/admin/cms-releases/[id]/page.tsx
2. app/api/releases/[id]/subtitles/route.ts

Tasks:

1. Add delivery actions:
- mark manual upload pending
- mark manual upload completed
2. Add notes input for operator remarks.
3. Keep export actions read-only to subtitle text.
4. Show naming convention helper for YouTube Studio uploads.

Acceptance:

1. Manual operations do not mutate subtitle content.
2. Operators can complete delivery when YouTube API sync is unavailable.

### 4.3 Canonical subtitle source enforcement

Files:

1. app/api/releases/[id]/subtitles/route.ts
2. app/api/releases/[id]/youtube-subtitles/route.ts
3. app/admin/cms-releases/[id]/page.tsx

Tasks:

1. Ensure all export formats derive from subtitleCues + subtitleTranslations canonical structures.
2. Ensure YouTube sync uses same source.
3. Add guard checks for missing language tracks.

Acceptance:

1. Web subtitles and exported files stay consistent per language.

## 5) Phase 3 Tasks (Integration Reliability)

### 5.1 Rewire legacy YouTube sync path

Files:

1. app/admin/youtube-sync/page.tsx
2. app/api/releases/route.ts
3. app/api/releases/[id]/route.ts

Tasks:

1. Replace direct legacy persistence path with release-domain API writes.
2. Create or update release records with slug and youtubeId mapping.
3. Respect identity constraints and canonical schema.

Acceptance:

1. Legacy sync no longer bypasses release domain rules.
2. Imported videos become canonical releases.

### 5.2 Improve sync result handling

Files:

1. app/api/releases/[id]/youtube-subtitles/route.ts
2. app/admin/cms-releases/[id]/page.tsx

Tasks:

1. Standardize result payload with per-language state and action.
2. Provide retry guidance and partial success messaging.
3. Ensure failed tracks stay recoverable via manual export path.

Acceptance:

1. Operators can identify and recover failed languages quickly.

## 6) Phase 4 Tasks (QA and Operations)

### 6.1 Fallback telemetry and QA visibility

Files:

1. app/(public)/release-detail/[slug]/page.tsx
2. CMS_OPERATIONS.md

Tasks:

1. Show non-intrusive fallback source marker for QA mode.
2. Emit telemetry event on fallback use.
3. Document expected fallback scenarios and triage steps.

Acceptance:

1. QA can verify source provenance for each rendered release.

### 6.2 Delivery checklists and runbooks

Files:

1. CMS_OPERATIONS.md
2. CMS_RELEASE_DELIVERY_SPEC.md
3. CMS_RELEASE_DELIVERY_EXECUTION_CHECKLIST.md

Tasks:

1. Add release-day operator checklist.
2. Add rollback and incident playbook.
3. Add done criteria for fully delivered status.

Acceptance:

1. Content operations can run releases without engineering support.

## 7) Suggested Work Sequence

1. Complete Phase 1 fully before UI expansions.
2. Implement Phase 2 delivery states and manual fallback controls.
3. Rewire legacy sync in Phase 3.
4. Finish telemetry and operations in Phase 4.

## 8) Definition of Done (Program Level)

1. Slug-first rendering is default and proven.
2. One canonical release persistence path is active.
3. Per-language delivery states are present, auditable, and actionable.
4. Automatic sync and manual fallback both work from one subtitle source.
5. QA can identify fallback source for every public release render.
6. Operations runbook supports release-day execution and recovery.

---

Use this file as the engineering execution baseline for phased implementation.
