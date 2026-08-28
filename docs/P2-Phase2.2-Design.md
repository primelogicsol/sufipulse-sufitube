# Phase 2.2: Automatic YouTube → Registry → PostgreSQL Synchronization

## 1. Architectural Posture
The core data pipeline will respect the frozen Title/Format governance model:
1. **YouTube** provides the raw external identity, A/B titles, and authoritative Analytics classification (`creatorContentType`).
2. **Registry** (`cmsServerStorage`) acts as the canonical storage authority. It retains invariant slugs and `canonicalTitle`.
3. **PostgreSQL** (`PostgresReleaseRepository`) acts as a read-optimized replica.
4. **Website** presents the data governed by PostgreSQL and the DTO layer.

**Rule of Thumb:** YouTube → Registry → PostgreSQL. Never the reverse, and never skipping Registry.

## 2. Existing Data Flow & Files Audit
- **YouTube Import**: `app/api/releases/import-youtube/route.ts` (currently manual, triggers on POST).
- **Registry Layer**: `lib/cms-storage-server.ts` exposes `bulkSaveReleases` to mutate the `.data/cms-releases.json` canonical file.
- **PostgreSQL Repository**: `server/db/release-repository.ts` exposes `insert`, `update`, but the live automatic replication from Registry does not currently exist in the API layer.
- **YouTube Client**: `lib/youtube-data-api-readonly.ts` / `lib/youtube-analytics-client.ts` fetch the video data and `creatorContentType`.

## 3. Proposed Pipeline Modifications & New Files
- **New File (`app/api/internal/youtube-release-sync/route.ts`)**: A protected cron/scheduler endpoint requiring a valid `Authorization: Bearer CRON_SECRET` to execute automatically.
- **Checkpoint Manager (`lib/sync-checkpoint.ts`)**: A new utility to securely persist and read `lastSuccessfulYouTubeSyncAt`, ensuring incremental discovery overlaps securely (e.g. looking back 24-48 hours before the checkpoint to catch stragglers).
- **Update to `PostgresReleaseRepository`**: Add a `bulkUpsert` method or integrate replication logic to elegantly mirror Registry outputs into the PostgreSQL layer cleanly.
- **Sync Audit Log (`lib/sync-audit-log.ts`)**: A durable audit storage (writing to a JSON array or similar persistent file `.data/sync-audit-log.json`) recording the strict metrics required per sync run (runId, triggeredAt, actions, invariant alarms).

## 4. Transaction Sequence & Rollback Behavior
The `/api/internal/youtube-release-sync` endpoint will strictly follow this sequence:

1. **Pre-flight & Checkpoint Load:** Authenticate, load `lastSuccessfulYouTubeSyncAt`, compute time window with a 48-hour overlap, and fetch Analytics content-type map.
2. **Discovery:** Fetch incremental videos from YouTube using the computed window.
3. **Canonical Mutation Prep:** Execute `mapVideoToRelease` against existing Registry records, preserving `canonicalTitle`, `slug`, and applying authoritative classification. Validate Zod schemas.
4. **Registry Upsert:** `cmsServerStorage.bulkSaveReleases()`.
5. **Replication Check:** Execute replication into PostgreSQL using `repository.upsert(release)` loop or bulk.
   - *Rollback:* If PostgreSQL replication fails midway, the script throws an error, the sync checkpoint is **NOT** advanced, and the audit log records a severe error. The Registry will safely retain the data, but the next sync run will re-attempt replication idempotently.
6. **Revalidate:** Call `revalidatePath` on cache boundaries (`/`, `/releases`).
7. **Advance Checkpoint:** Only upon 100% success of Postgres replication, update `lastSuccessfulYouTubeSyncAt`.
8. **Audit Log Write:** Append the run statistics to the sync audit history.

## 5. Evidence Plan for Acceptance Gates
- **P2.2-G1 (Frozen baseline unchanged):** Git diff verifies `page.tsx` and mapping files' governance constraints remain strictly intact.
- **P2.2-G2 (New upload discovered):** Run the sync script, then upload (or simulate) a new YouTube video, re-run, observe pick-up via checkpoint logic.
- **P2.2-G3 (Registry before Postgres):** Code inspection confirms `cmsServerStorage` commits before Postgres replication begins.
- **P2.2-G4 & P2.2-G5 (canonicalTitle & slug preserved):** Overwrite a YouTube video's title to a Variant B; the audit log will explicitly assert `canonicalTitleChanged: false` and `slugChanged: false`.
- **P2.2-G6 (creatorContentType correct):** Inject a mock Short and verify Postgres reads `format: 'short', source: 'youtube_analytics'`.
- **P2.2-G7 (Zero duplicates on idempotency):** Running the sync endpoint 3 times in a row produces `0 new`, `0 duplicates`.
- **P2.2-G8 (Failure checkpoint halt):** Inject a deliberate Postgres throw; observe that `lastSuccessfulYouTubeSyncAt` does not move.
- **P2.2-G9 (PostgreSQL matches Registry):** Data comparison test between `cms-releases.json` and Postgres `SELECT *` payload.
- **P2.2-G10 & P2.2-G11 (Chronology):** The `/releases?sort=newest` API identically matches the YouTube "Latest" queue output.
- **P2.2-G12 (Manual Sync):** The legacy manual `/admin/youtube-sync` POST request remains functional.
- **P2.2-G13 (Scheduler Protected):** GET/POST to `/api/internal/...` without token returns HTTP 401.
- **P2.2-G14 (Structured sync audit evidence):** Observe the generated `.data/sync-audit.log` file containing `runId`, `newCount`, etc.
- **P2.2-G15 (Clean compilation):** `tsc --noEmit` returns 0 errors.

Please review this transaction sequence and evidence plan. I will not proceed with coding until this design is confirmed internally consistent.
