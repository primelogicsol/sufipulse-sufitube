# Phase 2.2: Automatic YouTube → Registry → PostgreSQL Synchronization

## 1. Architectural Posture
The core data pipeline will respect the frozen Title/Format governance model:
1. **YouTube** provides the raw external identity, A/B titles, and authoritative Analytics classification (`creatorContentType`).
2. **Registry** (`cmsServerStorage`) acts as the canonical storage authority. It retains invariant slugs and `canonicalTitle`.
3. **PostgreSQL** (`PostgresReleaseRepository`) acts as a read-optimized replica.
4. **Website** presents the data governed by PostgreSQL and the DTO layer.

**Rule of Thumb:** YouTube → Registry → PostgreSQL. Never the reverse, and never skipping Registry.

## 2. Existing Data Flow & Files Audit
- **YouTube Import**: `app/api/releases/import-youtube/route.ts` (manual UI sync trigger).
- **Registry Layer**: `lib/cms-storage-server.ts` exposes `bulkSaveReleases` to mutate canonical files.
- **PostgreSQL Repository**: `server/db/release-repository.ts` currently performs individual non-transactional inserts/updates.
- **YouTube Client**: `lib/youtube-data-api-readonly.ts` / `lib/youtube-analytics-client.ts` fetch video data and classification.

## 3. Proposed Pipeline Modifications & New Files
- **Shared Sync Service (`server/services/youtube-release-sync.ts`)**: Orchestrates the entire sync flow under a shared lock. Used by both manual and automatic routes.
- **Automatic Endpoint (`app/api/internal/youtube-release-sync/route.ts`)**: Protected scheduler endpoint requiring `Authorization: Bearer CRON_SECRET`.
- **Checkpoint & Audit Persistence (`lib/sync-checkpoint.ts`)**: Manages atomic reads/writes to `${DATA_DIR}/youtube-release-sync-checkpoint.json` and append-only `${DATA_DIR}/youtube-release-sync-audit.jsonl`.
- **PostgreSQL Transactional Replication**: Adds `bulkUpsert()` to the repository, executing strictly within a `BEGIN / COMMIT / ROLLBACK` transaction.

## 4. Exact Transaction Sequence
The shared sync service will strictly enforce this 20-step execution model:

0. **Acquire Lock**: Acquire exclusive PostgreSQL advisory sync lock (HTTP 409 if unavailable).
1. **Init Audit**: Create audit run = `RUNNING`.
2. **Load Checkpoint**: Load durable checkpoint (`lastSuccessfulYouTubeSyncAt`).
3. **Discovery**: Discover YouTube candidates using a bounded overlap window.
4. **Fetch Analytics**: Fetch authoritative Analytics classifications.
5. **Resolve Registry**: Resolve existing Registry records by `youtubeId`.
6. **Build Mutations**: Build proposed canonical records.
7. **Assert Invariants**: Assert `canonicalTitle` unchanged, `slug` unchanged, governed metadata protected, and classification precedence respected (never overwrite higher-authority classification with weaker or missing Analytics).
8. **Zod Validation**: Zod-validate ALL candidate records.
9. **Separate Actions**: Determine which records are `created`, materially `updated`, or completely `unchanged` (unchanged records bypass writing to ensure true idempotency).
10. **Registry Upsert**: Perform atomic `bulkSaveReleases()` on created + materially updated records only.
   - *Registry Failure:* Abort before Postgres replication. NO Registry mutation, NO checkpoint movement. Restore/re-hydrate durable Registry state. Audit logs failure.
11. **Read Back**: Read back the saved canonical Registry records.
12. **Begin Transaction**: `BEGIN` PostgreSQL replication transaction.
13. **Replicate**: Replicate the exact Registry outputs into PostgreSQL. (PostgreSQL receives ONLY the record returned by Registry, preventing semantic drift).
14. **Verify Replica**: Verify PostgreSQL payload parity.
15. **Commit/Rollback**: `COMMIT` or completely `ROLLBACK` on any failure.
   - *Postgres Failure:* `ROLLBACK` replica, leave Registry as new canonical state, checkpoint remains unchanged.
16. **Revalidate Cache**: Call `revalidatePath` on public routes (`/`, `/releases`).
17. **Finalize Audit**: Append the detailed sync evidence to the JSONL log.
18. **Advance Checkpoint**: Atomically advance the sync checkpoint.
19. **Release Lock**: Release the exclusive sync lock.

## 5. Evidence Plan for Acceptance Gates
- **P2.2-G1 (Frozen baseline unchanged):** Git diff verifies validation schema, CMSRelease type, DB schema/type contract, release mapper, DTO, public filters, and GEMINI doctrine remain 100% strictly intact without semantic modification.
- **P2.2-G2 (New upload discovered):** Sync script detects and imports new YouTube videos via checkpoint overlap logic.
- **P2.2-G3 (Registry before Postgres):** Code inspection confirms `cmsServerStorage` commits before Postgres replication `BEGIN` statement.
- **P2.2-G4 & P2.2-G5 (canonicalTitle & slug preserved):** Overwrite a YouTube video's title; audit log explicitly asserts `canonicalTitleChanged: false` and `slugChanged: false`.
- **P2.2-G6 (creatorContentType correct):** Inject a mock Short and verify Postgres reads `format: 'short'` and `formatClassificationSource: 'youtube_analytics'`. (`source` remains `youtube` or existing provenance).
- **P2.2-G7 (True idempotency):** Successive sync runs on unchanged upstream material produce exactly `0 created, 0 updated, N unchanged`, generating zero Registry or Postgres writes.
- **P2.2-G8 (Failure checkpoint halt):** Inject deliberate PostgreSQL and Registry throws; observe `lastSuccessfulYouTubeSyncAt` does not advance.
- **P2.2-G9 (PostgreSQL matches Registry):** Data comparison test between canonical `cms-releases.json` and PostgreSQL payload output.
- **P2.2-G10 & P2.2-G11 (Chronology & Convergence):** `/api/releases?status=published&governance=native_governed&sort=newest&pageSize=20` perfectly matches the eligible native-governed YouTube Latest sequence by `youtubeId`.
- **P2.2-G12 (Manual Sync):** `POST /api/releases/import-youtube` delegates safely to the shared sync service and respects the shared lock.
- **P2.2-G13 (Scheduler Protected & Locked):** `/api/internal/youtube-release-sync` requires a CRON token, and simultaneous overlapping cron/manual calls yield HTTP 409 (Already Running).
- **P2.2-G14 (Structured sync audit evidence):** Observe `${DATA_DIR}/youtube-release-sync-audit.jsonl` accurately records immutable `runId`, actions, failures, and invariant alarm states.
- **P2.2-G15 (Clean compilation):** `tsc --noEmit` perfectly returns 0 errors.
