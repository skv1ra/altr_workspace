# PROMPT 047 — Unit and integration test expansion

## Current project state

All feature phases complete (028, 031, 035, 038, 041, 044, 046). Test suite is
a mix of preserved legacy suites and per-phase additions.

## Objective

Systematically close remaining unit/integration coverage gaps, with emphasis on
cross-user isolation, RLS verification, and webhook/AI-route security suites.

## Why this task exists

The final quality gate starts with a defensible test base — per-phase testing
was feature-scoped; this prompt is whole-system-scoped.

## Dependencies

All feature tracks complete.

## Files to inspect first

- Full `tests/` inventory + coverage output (`yarn vitest run --coverage` if
  configured; otherwise reason from the file inventory honestly)
- `supabase/tests/phase_3_rls_verification.sql` (how RLS is verified; whether
  it covers tables added after phase 3 — cross-check against the 26-table list
  in MASTER_CONTEXT)
- `tests/security-regression.test.ts`, `tests/integration/phase12-boundaries.test.ts`

## Files allowed to change

- `tests/**`, `supabase/tests/**` (additive SQL verification for uncovered
  tables — SQL tests only, no schema changes)
- `vitest.config.ts` (coverage config only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`, `RISKS.md`

## Files that must not be changed

`app/**`, `lib/**`, `components/**`, `workers/**`, `supabase/migrations/**`.
Fixing a genuine bug found by a new test is allowed as a minimal, separately-
committed change with the test that caught it.

## Implementation instructions

1. Coverage map: for each parity-matrix domain, list tested behaviors vs
   untested; prioritize: ownership scoping of every user-data endpoint,
   entitlement policy transitions, consent state machine, export content
   completeness, deletion ordering, rate-limit responses.
2. Extend the RLS SQL verification to any `altr_` table it does not cover;
   document how to run it against a real Supabase instance (it cannot run in
   CI without credentials — mark as manual-verification SQL).
3. Cross-user isolation: integration tests (mocked clients per existing
   patterns) asserting user-A queries never construct requests without the
   user scope — extend `phase12-boundaries` style checks to new endpoints
   (e.g. runs endpoint from 040, onboarding flag from 031).
4. Webhook security: re-run and extend signature edge cases (wrong length,
   non-hex, replayed event id) if not present.
5. Keep everything green: `yarn check`.

## Visual requirements

None.

## Security and privacy requirements

- New tests must fail when the property they guard is broken (spot-verify by
  temporary mutation, then revert — describe in report).

## Edge cases

- Coverage tooling absent → add minimal c8/v8 coverage config without new
  heavy dependencies, or record why not.

## Acceptance criteria

- [ ] Coverage map documented per domain.
- [ ] RLS SQL covers all user tables; run instructions documented.
- [ ] Isolation/webhook/rate-limit gaps closed.
- [ ] Mutation spot-checks performed for at least 3 new tests.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Run the RLS SQL against a development Supabase instance if credentials are
available; otherwise record as pending user action.

## Required tests

The gap-closing tests themselves; enumerate all in the report.

## Completion report

Report: coverage map, tests added per domain, mutation-check evidence,
RLS run status.

## Git checkpoint

`test: expand unit and integration coverage`

## Status update

Update `STATUS.md` and the 047 row in `INDEX.md`.
