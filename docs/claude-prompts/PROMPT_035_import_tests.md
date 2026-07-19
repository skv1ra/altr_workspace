# PROMPT 035 — Import tests

## Current project state

Import experience fully rebuilt (032–034) over the unchanged pipeline.

## Objective

Close Phase 7 with verification: full parser fixture matrix green, UI behavior
coverage, e2e lifecycle coverage, and an explicit pipeline-untouched proof.

## Why this task exists

Import is the highest-value data path and RISKS R7; the phase closes only on
proven parity.

## Dependencies

034.

## Files to inspect first

- `tests/unit/import-parsers.test.ts`, `tests/unit/phase12-import-formats.test.ts`
  (existing matrix), `tests/fixtures/imports/*`
- New import components; e2e import block

## Files allowed to change

- `tests/**` (import-related)
- Import components (fix-level only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`workers/**`, `lib/imports/**`, `app/api/imports/**`, `supabase/`, fixtures
(may ADD fixtures, never modify existing ones).

## Implementation instructions

1. Run the existing parser suites; they must pass byte-identically — any
   failure means the pipeline was touched: STOP, investigate, restore.
2. Pipeline-untouched proof: diff WORKSPACE `workers/`, `lib/imports/`, and
   `app/api/imports/` against LEGACY at `a22927d`
   (e.g. `git -C C:\Users\golyb\altrtest2 show a22927d:<path>` compared with
   the WORKSPACE file) — no semantic changes allowed; include the diff summary
   in the report.
3. Add RTL coverage gaps from 032–034 reports (pre-checks, stages, duplicate,
   taxonomy).
4. e2e: happy-path fixture import (exists — keep), plus duplicate-409 path and
   quota-429 path with mocks.
5. Add one new fixture only if a real gap exists (e.g. a zip fixture if none) —
   generated synthetically, documented.
6. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

None (test prompt); any UI fix stays within established design.

## Security and privacy requirements

- Fixtures contain only fictional data.
- Tests must assert `rawFileStored: false` remains in the create payload
  (add this assertion if absent — it guards invariant #7).

## Edge cases

- Windows/CI path separators in worker-related tests.
- Playwright file-upload timing for larger fixtures.

## Acceptance criteria

- [ ] Existing parser matrix passes unmodified.
- [ ] Pipeline-untouched diff proof recorded.
- [ ] New RTL + e2e coverage for 409/429/cancel paths.
- [ ] `rawFileStored: false` assertion present.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

One real-browser import of each fixture format in dev (mocked persistence),
spot-checking rendered outcomes.

## Required tests

As enumerated in steps 3–4; list them in the report.

## Completion report

Report: coverage delta, diff proof, fixture additions, command results.

## Git checkpoint

`test(import): full import flow coverage`

## Status update

Update `STATUS.md` (Phase 7 complete) and the 035 row in `INDEX.md`.
