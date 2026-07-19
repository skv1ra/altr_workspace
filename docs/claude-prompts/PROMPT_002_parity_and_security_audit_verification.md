# PROMPT 002 — Parity and security audit verification

## Current project state

Prompt 001 recorded both repos' baselines in `docs/claude-prompts/BASELINE_V2.md`.
All evidence to verify lives in the read-only LEGACY checkout
(`C:\Users\golyb\altrtest2` @ `a22927d`); this prompt writes only into
WORKSPACE documentation.

## Objective

Independently verify every COMPLETE claim in `FEATURE_PARITY_MATRIX.md` against the
actual LEGACY code, and verify the security invariants in `MASTER_CONTEXT.md`.

## Why this task exists

The rebuild's feature-parity gate is only as good as the matrix. A wrong COMPLETE
classification would silently drop a working feature; a wrong security claim would
propagate into the new UI.

## Dependencies

001.

## Files to inspect first

- `docs/claude-prompts/FEATURE_PARITY_MATRIX.md` (the claims under test)
- Every file cited as evidence in the matrix (routes, lib modules, migrations)
- `supabase/migrations/*.sql`, `supabase/tests/phase_3_rls_verification.sql`
- `lib/billing/webhook-handler.ts`, `lib/billing/webhook.ts`, `lib/imports/zip.ts`
- `tests/` — confirm each cited test file exists and covers what the matrix says
- `docs/SECURITY.md`, `docs/IMPORT_SECURITY.md`, `docs/LEGACY_BILLING_MIGRATION.md`

## Files allowed to change

- `docs/claude-prompts/FEATURE_PARITY_MATRIX.md` (corrections only, with evidence)
- `docs/claude-prompts/RISKS.md` (new findings)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

The entire LEGACY checkout (read-only — inspection commands only). There is no
application code in WORKSPACE yet.

## Implementation instructions

1. For each matrix row marked COMPLETE, open the cited files and confirm the
   feature is real, wired, and reachable from the UI. Downgrade any row that is
   actually PARTIAL/MOCKED, with a one-line evidence note.
2. Verify each of the 10 security invariants in MASTER_CONTEXT with a concrete
   code citation (file:line). Record the citations in a new "Verified invariants"
   appendix at the bottom of the matrix.
3. Resolve the open canonical-module questions in LEGACY: is `lib/plans.ts` or
   `lib/billing/plans.ts` canonical? Is `lib/auth/rateLimit.ts` still imported
   anywhere (`grep` in the LEGACY checkout)? Record findings — Prompt 004 ports
   only the canonical modules; change nothing anywhere.
4. Confirm every COMPLETE row has a rebuild prompt, test prompt, and manual-check
   prompt assigned (traceability gate). Fix gaps by editing the matrix.
5. Verify RLS: confirm every `altr_` user table appears in RLS policy definitions
   in the migrations. List any table without RLS in RISKS.md.

## Visual requirements

None.

## Security and privacy requirements

Read-only against code. No credentials used.

## Edge cases

- Evidence file cited in the matrix does not exist → fix the matrix, note in report.
- A feature exists but is unreachable from any page (dead code) → reclassify
  LEGACY-UNUSED.

## Acceptance criteria

- [ ] Every COMPLETE row re-verified or corrected with evidence.
- [ ] All 10 security invariants have file:line citations.
- [ ] Canonical-module questions answered in writing.
- [ ] Traceability gate holds: no COMPLETE feature without prompts.
- [ ] RLS coverage list produced.

## Verification commands

- `git status` in the LEGACY checkout (must show no staged/committed changes)
- `git status` in WORKSPACE (only docs/claude-prompts changes)

## Manual verification

Spot-check three random matrix rows yourself against the code.

## Required tests

None new.

## Completion report

Report: matrix rows corrected (before → after), invariant citations, canonical
answers, RLS findings, unresolved issues.

## Git checkpoint

`docs: verify feature parity and security audit`

## Status update

Update `STATUS.md` and the 002 row in `INDEX.md`.
