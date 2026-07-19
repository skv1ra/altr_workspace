# PROMPT 037 — Memory editing and provenance

## Current project state

Memory overview rebuilt (036). Legacy modals
(`MemoryEditModal`, `MemoryDeleteModal`) implement create/edit/delete;
PATCH/DELETE `/api/memories/[id]`, POST `/api/memories`, clear-all DELETE
`/api/memories`.

## Objective

Rebuild memory manipulation: creation, editing, disable/enable, deletion (single
and clear-all), and the full provenance view — using the 010 overlay system.

## Why this task exists

Editability is the product's consent story: "your memory, you shape it". The
destructive paths must use the confirmed-dialog invariant.

## Dependencies

036.

## Files to inspect first

- Legacy modals (field sets, validation mirrors of API zod schemas)
- `/api/memories` schemas (category ≤80, title ≤180, description ≤4000,
  confidence 0–1, active), PATCH semantics, provenance rows shape
- ConfirmDialog capabilities from 010

## Files allowed to change

- `components/app/memory/` (editor, provenance, delete flows)
- `app/(app)/memory/page.tsx`
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

(LEGACY `components/memory/` was never ported — no deletion step; it remains
reference-only in the read-only checkout.)

## Files that must not be changed

`app/api/memories/**`, `lib/`, `supabase/`.

## Implementation instructions

1. Editor (create + edit in one component): fields matching the API schema
   exactly; category as combobox over existing categories + free entry;
   inline validation mirroring server limits; save via existing endpoints;
   optimistic-free (server confirm → list refresh → toast).
2. Disable/enable: immediate toggle with clear semantics copy ("Disabled
   memories are never used by your Twin") — verify that claim against the
   retrieval RPC's `is_active` filter and cite it in the report.
3. Delete single: ConfirmDialog destructive variant naming the memory title.
   Clear-all: typed confirmation ("DELETE ALL MEMORIES") — stricter than
   legacy's window.confirm, satisfying invariant #8; wire to the existing
   clear-all endpoint.
4. Provenance panel: sources list (type, reference, excerpt, linked import/
   conversation), extraction model/version for AI-extracted memories — all
   fields the API already returns.
5. Port and adapt the related LEGACY e2e blocks (memory CRUD).
   `yarn check` + `yarn test:e2e`.

## Visual requirements

Editor in a side-panel dialog on desktop (full-screen sheet on mobile);
provenance reads as an archival record — mono-spaced reference IDs, hairline
timeline.

## Security and privacy requirements

- Excerpts in provenance are already-stored sanitized excerpts — render as
  text, never as HTML.
- Destructive copy explicit; clear-all consequences stated (drafts lose
  context — verify wording truthfulness).

## Edge cases

- Editing a memory deleted in another tab (404 → designed gone-state).
- Confidence edge values 0 and 1 display.
- Provenance with dangling references (source import deleted).

## Acceptance criteria

- [ ] Create/edit/disable/delete/clear-all live against real endpoints.
- [ ] Typed confirmation for clear-all; ConfirmDialog for single delete.
- [ ] Provenance panel complete; `is_active` claim verified with citation.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Full CRUD round-trip mocked; keyboard-only editor session; clear-all ceremony.

## Required tests

RTL: editor validation mirrors limits, disable toggle semantics, typed
confirmation gate. Updated e2e memory CRUD.

## Completion report

Report: schema-mirror table, invariant citations, deleted files with proof,
command results.

## Git checkpoint

`feat(memory): editing and provenance UX`

## Status update

Update `STATUS.md` and the 037 row in `INDEX.md`.
