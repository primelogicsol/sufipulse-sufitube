# Release Detail Page Maintenance Standard

The file `app/(public)/release-detail/[slug]/page.tsx` is highly fragile due to its extreme length (5,400+ lines) and complex hook/tab logic.

## Critical Mandates

### 1. Freeze Broad Edits
- **NO** architectural rewrites.
- **NO** full-file rewrites via `write_file` (unless recovering from corruption).
- **NO** broad UI refactors.
- **NO** modifications to hook order.

### 2. Surgical Maintenance Protocol
- Only perform targeted fixes using the `replace` tool with precise `old_string` and `new_string` blocks.
- **Pre-Change Verification**:
  1. Identify exact JSX block.
  2. Identify state/hooks used.
  3. Confirm hook order is preserved.
  4. Confirm tab logic is untouched.
- **Post-Change Validation**:
  - `npm run type-check`
  - `npm run build`
  - Manual verification of every tab (`overview`, `credits`, `subtitles`, `lyrics`, `adopt`, `commentary`, `sponsors`).

### 3. Progressive Componentization
- Moving forward, logic should be extracted into standalone components in the `components/` subdirectory of the route.
- Initial extraction targets:
  - `ShareModal`
  - `ContributorShareKit`
  - `StreamingPlatforms`
  - `RecentAdopters`

## Mandatory Prompt Prefix
Every task involving this file must adhere to this philosophy:
> Do not rewrite the release detail page. Do not modify unrelated tabs. Do not change hook order. Do not replace working modules with placeholders. Do not expose admin workflow states publicly. Only fix the named component.
