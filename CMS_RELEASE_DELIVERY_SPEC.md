# SufiPulse Release Delivery Specification

Status: Proposed for implementation
Date: 2026-04-03
Owner: CMS + Public Experience + Integrations

## 1) Purpose

Define one world-class release workflow where CMS governs editorial truth, the web app renders from CMS, YouTube receives compatible caption assets when possible, and manual upload remains a first-class fallback.

This specification is implementation-oriented and aligned with existing capabilities already present in the codebase.

## 2) Goals

1. Use one canonical release domain model for editorial and subtitle governance.
2. Resolve public release pages by slug first.
3. Treat youtubeId as external media reference only.
4. Deliver subtitle assets to YouTube by API sync when available.
5. Always provide exportable files for manual YouTube Studio upload.
6. Expose source and fallback telemetry for QA and support.

## 3) Non-Goals

1. Replacing YouTube as the hosting/distribution platform.
2. Moving all web-only editorial presentation to YouTube.
3. Building a new schema from scratch when existing release model fields already cover the need.

## 4) Canonical Data Ownership

### CMS-owned fields

1. Internal identity and publishing
- id
- slug
- status
- publish controls

2. Editorial and presentation
- title override and description
- commentary
- credits
- release notes and spiritual notes
- channel override behavior

3. Language and subtitle governance
- subtitle cues
- subtitle translations by language
- language review states
- style packs and cue metadata
- per-language sync metadata and errors

### YouTube-owned fields

1. Media distribution
- video hosting and playback
- channel distribution

2. External metadata
- youtubeId reference
- optional YouTube metadata snapshots

## 5) Identity Contract

1. id = internal relation key.
2. slug = public route key.
3. youtubeId = external media pointer only.

### Hard identity constraints

1. slug must be unique across releases.
2. youtubeId must be unique when present.
3. A release may exist without youtubeId only when intentionally web-only.
4. One public release page maps to exactly one canonical release record.

Required behavior:

1. Public release pages must resolve by slug first.
2. youtubeId lookup is compatibility-only and must not be primary.
3. Analytics/debug should indicate how a release was resolved.

## 6) Delivery State Model

Track state per subtitle language track:

1. web_only
- Available on SufiPulse only.
- Not synced to YouTube yet.

2. synced_to_youtube
- Successfully pushed by API sync.
- Store caption id, hash, timestamp, format, status.

3. manual_upload_pending
- Export created for manual YouTube upload.
- Awaiting confirmation.

4. manual_upload_completed
- Team confirms upload in YouTube Studio.
- Record actor and timestamp.

5. sync_failed
- Last automatic sync failed.
- Preserve error for retry and triage.

## 7) Admin UI Requirements (Release Delivery Section)

Each release editor must include a dedicated Delivery panel.

### A) Web UI block

1. Publish to web toggle
2. Public slug display
3. Preview public URL action
4. Current web publish status

### B) YouTube Sync block

1. Target youtubeId display and validation
2. Sync changed tracks action
3. Force sync all tracks action
4. Sync selected language action
5. Last sync summary
- success count
- skipped count
- failed count
6. Per-language sync grid
- state
- caption id
- last uploaded at
- last error

### C) Manual Export block

1. Export selected language in SRT
2. Export selected language in VTT
3. Export selected language in ASS
4. Export all languages as ZIP
5. Copy naming convention action
6. Mark manual upload pending/completed actions
7. Upload notes field for operator remarks

## 8) Public Rendering Contract

When opening a release page:

1. Resolve by slug.
2. Load canonical CMS release.
3. Render CMS editorial fields as primary content.
4. Use youtubeId for embed and optional media enrichment.
5. Render a hidden/internal source tag for QA:
- cms_slug
- cms_youtube_compat
- external_youtube_fallback

Section precedence:

1. Hero/media
- title: CMS override, else YouTube title snapshot
- thumbnail: CMS override, else YouTube thumbnail
- embed: youtubeId

2. Editorial sections
- credits from CMS
- lyrics and language switching from CMS
- subtitle/translation UI from CMS
- commentary from CMS
- subscribe/channel block with release override then env default

## 8.1) Fallback write safety rules

1. YouTube sync must never overwrite CMS-owned editorial fields.
2. YouTube metadata refresh may update only approved snapshot fields.
3. Manual upload state changes must never alter subtitle text content.
4. Export generation must be read-only against subtitle content.

## 8.2) Canonical subtitle source rule

1. All export formats (JSON, VTT, SRT, ASS) must be generated from one canonical subtitle track source.
2. Per-format editors are not allowed as parallel authorities.
3. Public subtitle rendering and export outputs must resolve from the same cue and translation dataset.

## 9) API and Integration Boundaries

Keep these boundaries explicit:

1. Release CRUD boundary
- Create/update/read release domain through release API.

2. Subtitle export boundary
- Provide JSON, VTT, SRT, ASS outputs per release/language.

3. YouTube sync boundary
- Push captions by language through YouTube subtitle sync endpoint.
- Store result metadata and errors on release record.

4. Legacy sync rewire requirement
- Any YouTube import/sync flow must write through release domain API, not bypass it.

## 10) Operational Workflow

### Ingest or create release

1. Create or update release record linked to youtubeId.
2. Assign slug and publish state.
3. Fill editorial sections (credits, commentary, notes).
4. Prepare subtitle cues/translations and language reviews.

### Publish to web

1. Validate release quality gates.
2. Publish web state.
3. Verify public rendering from CMS record.

### Deliver to YouTube

1. Run Sync Changed by default.
2. If full reset needed, run Force Sync.
3. Review per-language sync outcomes.

Rule: Web publishing does not depend on YouTube caption sync success.

### Manual fallback

1. Export required files from CMS.
2. Upload manually in YouTube Studio.
3. Mark manual state in CMS.
4. Log operator notes and completion time.

## 10.1) Content readiness model

Track release readiness separately from per-language delivery states:

1. draft
2. editorial_ready
3. web_published
4. youtube_delivery_in_progress
5. fully_delivered
6. delivery_attention_required

## 11) Quality Gates

Pre-publish checks:

1. Release resolves by slug.
2. youtubeId present and playable.
3. At least one language verified.
4. Credits/commentary completeness satisfied.
5. Delivery panel has no blocking errors.

Post-publish checks:

1. Public page displays CMS-first content.
2. Subtitle language states match expected delivery mode.
3. YouTube captions visible for synced or manually uploaded tracks.
4. Source telemetry does not indicate unexpected fallback.

## 12) Telemetry and Auditability

Minimum release-level telemetry:

1. resolution_source
2. last_sync_attempt_at
3. last_sync_result summary
4. per-language delivery state
5. manual_upload_actor and manual_upload_at

Minimum admin audit events:

1. release_published_web
2. youtube_sync_changed
3. youtube_sync_force
4. subtitle_export_generated
5. manual_upload_marked_pending
6. manual_upload_marked_completed

## 13) Migration and Risk Controls

1. Unify release persistence to one canonical store.
2. Keep compatibility read path temporarily for youtubeId lookup.
3. Add migration marker after legacy data merge.
4. Deprecate split persistence keys after verification window.
5. Surface fallback usage in QA tools and logs.

## 14) Implementation Phases

### Phase 1: Contract hardening

1. Slug-first public resolution.
2. Canonical release store enforcement.
3. Compatibility fallback flags and telemetry.

### Phase 2: Delivery panel completion

1. Add full Web UI + YouTube Sync + Manual Export controls.
2. Add per-language delivery states and manual state transitions.

### Phase 3: Integration reliability

1. Rewire legacy sync paths through release API.
2. Add richer sync result handling and retry guidance.

### Phase 4: QA and operations

1. Add source/fallback dashboards.
2. Add release delivery checklists for content ops.

## 15) Acceptance Criteria

1. Public route always resolves by slug first.
2. youtubeId is used as media reference, not primary route identity.
3. One canonical release persistence path is active.
4. Release editor provides automatic sync and manual export fallback.
5. Per-language delivery state is visible and auditable.
6. QA can identify fallback source for every rendered release.

## 16) Operator Runbook (Short Form)

1. Prepare release in CMS.
2. Publish to web.
3. Sync captions to YouTube.
4. If sync fails, export and upload manually.
5. Mark manual completion in CMS.
6. Verify web and YouTube consistency.

Operator principle:

Web UI is primary editorial delivery.
YouTube caption delivery is secondary distribution.
If YouTube sync fails, manual export keeps operations moving.

---

This specification should be used as the implementation baseline for CMS and Public release delivery work.

Execution companion:

See CMS_RELEASE_DELIVERY_EXECUTION_CHECKLIST.md for phase-by-phase engineering tasks, file mappings, and current gap status.
