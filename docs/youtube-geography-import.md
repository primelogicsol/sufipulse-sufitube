# YouTube Studio Geography Snapshot Pipeline

## Overview

The **Global Audience by Country** section inside the **SufiPulse Global Reach** dashboard (`/releases`) consumes a verified, versioned snapshot stored at `.data/youtube-studio-geography.json`.

- **Source:** Official YouTube Studio Geography Export (`.zip` archive containing `Table data.csv`, `Chart data.csv`, and `Totals.csv`).
- **Public Display Mode:** Published Verified Snapshot (read-only via `GET /api/public/youtube/global-reach` and `GET /api/public/youtube/geography`).
- **Privacy & Security:** Public pages never read local user directories or expose filesystem paths. All ZIP extraction, SHA-256 verification, country normalization, and totals reconciliation occur strictly server-side or via the CLI import tool.
- **Baseline Preservation:** Importing a Geography ZIP updates `.data/youtube-studio-geography.json` only and never overwrites the existing Global Reach Index, Age and Gender, Audience Retention & Discovery, or `Countries Reached (53)` baseline cards.

---

## How to Export a Newer Geography Snapshot from YouTube Studio

1. Sign in to **YouTube Studio** for **SufiPulse USA** (`UCraDr3i5A3k0j7typ6tOOsQ`).
2. Go to **Analytics** → **Audience** (or **Advanced Mode** → **Geography** tab).
3. Select the **Lifetime** date range (e.g., `May 20, 2025 – <Current Date>`).
4. Ensure columns include **Geography**, **Views**, **Average view duration**, and **Watch time (hours)**.
5. Click **Export current view** → **Comma-separated values (.csv)**, which downloads a `.zip` file named like:
   `Geography YYYY-MM-DD_YYYY-MM-DD SufiPulse USA.zip`

---

## Option A: Replace Snapshot via CLI (Development / Deployment Update)

Run the import command from the repository root, passing the local path to the downloaded `.zip`:

```powershell
npm run geography:import -- "C:\path\to\Geography YYYY-MM-DD_YYYY-MM-DD SufiPulse USA.zip"
```

What this command does:
1. Verifies the `.zip` exists and computes its **SHA-256** checksum.
2. Extracts the archive into an isolated temporary directory (cleaned up automatically) and validates `Table data.csv`, `Chart data.csv`, and `Totals.csv`.
3. Excludes the aggregate `Total` row from rankings, normalizes all ISO-3166-1 alpha-2 country codes, classifies zero-view/suppressed rows and small-sample countries, and reconciles country sums against the channel `Total` row.
4. Increments `version` (when checksum changes), appends to `importHistory`, and atomically writes `.data/youtube-studio-geography.json` without storing any local directory paths.

---

## Option B: Replace Snapshot via Authenticated Admin API

Authenticated administrators (`admin` / `super_admin`) can upload a new `.zip` export via `multipart/form-data`:

- **Endpoint:** `POST /api/admin/youtube-analytics/geography-import`
- **Form Fields:**
  - `file` *(required)*: The official YouTube Studio Geography `.zip` file (max 15 MB).
  - `reportingPeriodStart` *(optional)*: `YYYY-MM-DD` override if the `.zip` filename was renamed.
  - `reportingPeriodEnd` *(optional)*: `YYYY-MM-DD` override if the `.zip` filename was renamed.
- **Inspection Endpoint:** `GET /api/admin/youtube-analytics/geography-import` (admin-only metadata + version history).

---

## Verification After Updating

Run the automated Geography verification suite to validate CSV reconciliation, Top-10 sorting invariants, API sanitization, and dashboard rendering:

```powershell
npx tsx scripts/test-youtube-geography.ts
```
