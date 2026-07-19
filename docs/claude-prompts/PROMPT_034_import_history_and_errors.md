# PROMPT 034 — Import history and errors

## Current project state

Import creation lifecycle rebuilt (033). GET `/api/imports` returns up to 100
imports with status, counts, parser version, extraction state.

## Objective

Build the import history surface: past imports with provenance, outcome detail,
error taxonomy, and the bridge to imported conversations/memories.

## Why this task exists

Parity (import history is COMPLETE server-side) and trust: users must see what
was ingested, when, and what became of it.

## Dependencies

033.

## Files to inspect first

- GET `/api/imports` response fields (the full column list in the route)
- Error/warning codes emitted by parsers (`lib/imports/parsers.ts` throw codes,
  warnings array) — build the human-readable taxonomy from the REAL codes
- `altr_conversations`/`altr_messages` relationship (what "view conversations"
  can link to — if no conversation-browsing page exists, link to memory filtered
  by source instead; verify what 036–037 will provide)

## Files allowed to change

- `components/app/imports/ImportHistory*.tsx` (create)
- `app/import-conversations/page.tsx` (history section)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/imports/**`, `workers/**`, `supabase/`.

## Implementation instructions

1. History list: editorial rows (platform mark, source name, date, counts,
   status) newest first; expandable detail: parser version, file size, warnings
   (human-readable), extraction outcome, provenance hash (shortened).
2. Error taxonomy: map every real parser/API error code (MALFORMED_ENCODING,
   JSON_TOO_DEEP, ZIP limits, MIME_EXTENSION_MISMATCH, FILE_SIZE_LIMIT_REACHED,
   DUPLICATE_IMPORT, extraction errors…) to calm, actionable copy (EN + UA).
   Unknown codes get a designed generic with the code visible for support.
3. Per-row actions: retry (failed), resume extraction (partial), delete import
   record if the API supports DELETE (verify `[id]/route.ts` — if unsupported,
   no delete button; never a dead control).
4. Empty state: designed first-run invitation. `yarn check` + `yarn test:e2e`.

## Visual requirements

Rows, not cards; status as quiet typographic states (Completed / Failed /
Processing / Cancelled) with hairline color-free differentiation plus a small
glyph — status must survive grayscale.

## Security and privacy requirements

- Detail view shows metadata only — never message content previews beyond the
  stored sanitized `preview` field the API already returns.

## Edge cases

- 100-row cap: note "showing last 100" when at cap.
- Import stuck in `processing` past staleness → display as interrupted with
  retry (mirrors server takeover rule).
- Mixed-language source names, RTL text in source names.

## Acceptance criteria

- [ ] History with expandable provenance detail live.
- [ ] Complete error taxonomy mapped from real codes (list in report).
- [ ] No dead actions; empty state designed.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mock history with every status + several error codes; verify copy quality and
grayscale legibility.

## Required tests

RTL: row states, taxonomy mapping function (unit-test the code→copy map
exhaustively against the real code list).

## Completion report

Report: taxonomy table, linking decisions (conversations vs memory), command
results.

## Git checkpoint

`feat(import): history and error states`

## Status update

Update `STATUS.md` and the 034 row in `INDEX.md`.
