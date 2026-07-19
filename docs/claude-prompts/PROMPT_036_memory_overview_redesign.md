# PROMPT 036 — Memory overview redesign

## Current project state

Import phase complete (035). Legacy memory page (`app/memory/page.tsx`) with
`components/memory/*` is COMPLETE: list with search/category/pagination via
GET `/api/memories`, plus status/data-sources panels.

## Objective

Rebuild the memory overview in the new system: the list, search, category
filtering, and pagination — the app's most personal surface.

## Why this task exists

Memory is the product's heart; the landing's MemoryDemo (021) promised this
surface — now the real one must match it.

## Dependencies

029 (shell); 035 recommended.

## Files to inspect first

- `app/memory/page.tsx` + all of `components/memory/` (features to preserve:
  category tabs, status panel, data-sources panel)
- GET `/api/memories` params/response (q, category, page, pageSize≤50, total,
  memories with joined `altr_memory_sources`)
- `components/memory/types.ts`; MemoryDemo from 021 (visual continuity)
- Memory e2e test (contract to migrate)

## Files allowed to change

- `app/(app)/memory/page.tsx` (create at URL `/memory`),
  `components/app/memory/` (create new family — LEGACY `components/memory/`
  was never ported and stays reference-only)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/memories/**`, `lib/`, `supabase/`.

## Implementation instructions

1. Page in the app shell: header with count + QuotaMeter (active memories vs
   plan), search field (debounced → `q`), category filter as quiet text tabs
   (derive the category set from data, matching legacy tab behavior), URL-
   synced state (q/category/page in searchParams for shareable state).
2. Memory rows: editorial — category label, title, description (clamped),
   confidence rendered subtly (not a percent badge — e.g. hairline opacity),
   provenance hint ("from Telegram import · Mar 2026"), active/disabled state
   visually honest.
3. Pagination: calm numeric pager driven by `totalPages` (server truth).
4. Empty states: no memories at all (invite to import) vs no matches for
   filter (clear-filters action) — distinct designs.
5. Preserve the data-sources/status panel information in the new layout
   (inspect what they show; fold into the page header area).
6. Migrate memory e2e selectors. `yarn check` + `yarn test:e2e`.

## Visual requirements

Continuity with the 021 demo — a visitor who saw the landing must recognize
this surface. Rows on obsidian, generous line-height, no card grid.

## Security and privacy requirements

- Search input sanitized display-side; server already guards query injection —
  do not weaken its stripping.
- No memory content in URLs beyond the user's own typed query.

## Edge cases

- 4000-char descriptions clamp with expand-in-place.
- Page beyond range (URL-edited) → clamp to last page.
- Category with zero results after deletion.

## Acceptance criteria

- [ ] List/search/filter/pagination live with URL-synced state.
- [ ] Both empty states designed; quota surfaced.
- [ ] Memory e2e green with migrated selectors.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked walkthrough with 0, 3, and 60 memories; filter + search combinations;
375px layout.

## Required tests

RTL: row rendering, empty-state variants, debounced search call. Updated e2e.

## Completion report

Report: preserved panel information mapping, selector migrations, command
results.

## Git checkpoint

`feat(memory): redesigned memory overview`

## Status update

Update `STATUS.md` and the 036 row in `INDEX.md`.
