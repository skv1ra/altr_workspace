# PROMPT 033 — Import progress, cancel, retry

## Current project state

New import surface live (032) over the unchanged pipeline. Legacy already
implements: AbortSignal cancellation, duplicate 409 (`source_hash`), stale-
processing takeover, chunked persistence, post-import memory extraction.

## Objective

Design and wire the live import lifecycle UX: staged progress, cancellation,
duplicate resolution, retry, and the extraction phase — all against existing
behaviors.

## Why this task exists

The pipeline's robustness is invisible without honest progress UX; users must
never wonder whether a large import is alive.

## Dependencies

032.

## Files to inspect first

- Worker message protocol (progress events available today — build on what
  exists; if the worker emits no granular progress, stage-level progress is the
  honest ceiling)
- `app/api/imports/[id]/chunks/route.ts`, `[id]/extract/route.ts`,
  `[id]/route.ts` (status transitions, extraction_cursor)
- Duplicate 409 response shape; stale takeover conditions

## Files allowed to change

- `components/app/imports/` (progress, lifecycle components)
- `app/import-conversations/page.tsx`
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`workers/**`, `lib/imports/**`, `app/api/imports/**`, `supabase/`.

## Implementation instructions

1. Stage rail: Reading file → Parsing (n conversations found, live if the
   protocol provides counts) → Saving (chunk x/y — chunk count is known
   client-side) → Extracting memories (batch progress via extraction responses)
   → Done. Only show numbers that are real.
2. Cancel: visible during parse/save; wires the existing AbortSignal; cancelled
   state is a designed terminal state with restart action. Define and verify
   what happens to a partially-persisted import on cancel (inspect API; reflect
   truth in UI copy).
3. Duplicate 409: designed resolution panel — show the existing import's date/
   status with "View in history" and "This is a different file" guidance
   (re-export hint), never a raw error.
4. Retry: failed imports re-runnable respecting the stale-takeover rule;
   extraction failures retry via the extract endpoint's cursor without
   re-importing.
5. Quota touchpoints: monthly import limit reached → 429 path renders the
   QuotaMeter reached-state with upgrade path. `yarn check` + `yarn test:e2e`.

## Visual requirements

Progress is calm: thin luminous progress line, stage labels in Label type,
no percent theatrics for unknowable quantities; completion resolves with a
single quiet confirmation, not confetti.

## Security and privacy requirements

- Progress/error surfaces never print message contents — counts and titles of
  stages only.
- Cancellation must actually abort work (verify no zombie chunk uploads).

## Edge cases

- Tab close mid-import (stale takeover covers server side; on return, history
  shows honest state — verify in 034).
- Extraction quota (`MEMORY_LIMIT_REACHED`) mid-extraction → partial success
  state with clear explanation (memories saved so far are real).
- Very fast small imports: stages must not flash-skip unreadably (min display).

## Acceptance criteria

- [ ] Full lifecycle UX wired to real behaviors, no invented progress numbers.
- [ ] Cancel verified to abort (network tab evidence in report).
- [ ] Duplicate and quota paths designed and tested.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Large fixture (or duplicated fixture content) run: watch stages; cancel
mid-parse; re-import same file for the 409 panel.

## Required tests

RTL: stage rail states, duplicate panel, cancelled state. e2e: import happy
path still green; add cancel-path coverage if mockable.

## Completion report

Report: real vs stage-level progress decisions, cancel verification evidence,
command results.

## Git checkpoint

`feat(import): progress and recovery flows`

## Status update

Update `STATUS.md` and the 033 row in `INDEX.md`.
