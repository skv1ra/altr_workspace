# PROMPT 032 — Import experience redesign

## Current project state

Shell + quota components ready (031). Legacy import page
(`app/import-conversations/page.tsx`) is functional and COMPLETE: consent
checkbox, file input, worker parse, chunked upload, extraction — but
template-styled.

## Objective

Rebuild the import surface in the new system: provider selection with export
guidance, file picker + drag-and-drop, and consent — wired to the exact
existing pipeline.

## Why this task exists

Import is the product's front door for data; it must feel trustworthy and
premium while keeping the audited local-parse pipeline untouched (ADR-005).

## Dependencies

029 (031 recommended for QuotaMeter).

## Files to inspect first

- `app/import-conversations/page.tsx` (full current flow — the contract)
- `workers/conversation-parser.worker.ts`, `lib/imports/{types,limits,parsers}.ts`
  (platforms, size limits, worker message protocol)
- `app/api/imports/route.ts` (create schema incl. `rawFileStored: false`,
  sourceHash sha-256, mime/extension allow-list)
- Import e2e test (fixture flow to keep passing)

## Files allowed to change

- `app/import-conversations/page.tsx` (rebuild — keep the URL),
  `components/app/imports/` (create)
- `lib/i18n/copy.ts`
- `tests/components/`, e2e import selectors
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`workers/**`, `lib/imports/**`, `app/api/imports/**`, `supabase/`,
`lib/billing/**`.

## Implementation instructions

1. Provider selection: the 8 real platforms (manual, telegram, gmail, whatsapp,
   instagram, messenger, slack, discord) as an editorial list with per-provider
   export instructions (accurate steps for obtaining the export file — verify
   accepted formats per provider from parsers before writing guidance).
2. Drop zone: full-surface drag-and-drop + file picker; client-side pre-checks
   mirroring the API (size vs plan limit via QuotaMeter data, extension/mime)
   with precise designed rejections BEFORE parsing.
3. Consent: the existing processing-consent checkbox behavior preserved exactly
   (inspect what it gates and how it persists via `/api/consents/grant`).
4. Wire the EXISTING worker protocol and API calls without modification —
   the new UI is a skin over the proven pipeline. Do not re-derive hashing or
   chunking client-side; reuse the current module functions.
5. Privacy statement on-surface: "Your file is read in your browser. The
   original archive is never uploaded." (true per audit).
6. Update import e2e selectors, same fixture and assertions. `yarn check` +
   `yarn test:e2e`.

## Visual requirements

The drop zone is a cinematic moment — fog surface that responds to drag-over
with a slow light bloom (reduced-motion safe); provider list editorial, no logo
soup (small monochrome marks only).

## Security and privacy requirements

- `rawFileStored: false` contract untouched; no code path uploads raw bytes.
- Consent gating preserved; guidance copy must not tell users to bypass
  provider export safeguards.

## Edge cases

- 0-byte file, wrong-extension-right-mime, oversized file per plan (413 path),
  drag of multiple files (define: first file only, stated in UI).
- Worker crash → designed error with retry, not a frozen state.

## Acceptance criteria

- [ ] All 8 providers with accurate guidance; picker + drag-drop working.
- [ ] Pipeline contract untouched (diff proves UI-only changes outside allowed list).
- [ ] Pre-check rejections designed and precise.
- [ ] Import e2e passes with migrated selectors.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Import the telegram fixture through the real UI in dev (mocked persistence);
try each rejection case.

## Required tests

RTL: provider list, pre-check rejections, consent gating. Updated e2e.

## Completion report

Report: guidance accuracy sources, contract-parity proof, command results.

## Git checkpoint

`feat(import): redesigned import experience`

## Status update

Update `STATUS.md` and the 032 row in `INDEX.md`.
