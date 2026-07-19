# PROMPT 044 — Billing regression tests

## Current project state

All billing surfaces rebuilt (042–043).

## Objective

Close Phase 10: prove the billing backend is untouched, and complete UI-level
billing coverage.

## Why this task exists

Billing is real money and RISKS R5; the phase closes only with the webhook /
entitlement / no-client-grant properties re-proven.

## Dependencies

043.

## Files to inspect first

- Existing suites: `tests/unit/lemon-webhook.test.ts`, `tests/unit/entitlements.test.ts`,
  `tests/unit/phase12-billing.test.ts`, `tests/integration/lemonSqueezy.test.ts`
- New billing components; billing e2e blocks

## Files allowed to change

- `tests/**` (billing-related)
- `components/app/billing/` (fix-level only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`, `RISKS.md`

## Files that must not be changed

`app/api/billing/**`, `app/api/webhooks/**`, `lib/billing/**`, `supabase/`.

## Implementation instructions

1. Backend-untouched proof: diff WORKSPACE `lib/billing/`, `app/api/billing/`,
   `app/api/webhooks/` against LEGACY at `a22927d` (read-only checkout) —
   semantic no-change required; record the diff summary.
2. Run all existing billing suites — must pass unmodified.
3. Add UI coverage gaps: state-machine tests from 043, portal pending/failure,
   plan-state action matrix from 042, pricing CTA contract (023) if not
   already covered.
4. Source-level assertion (security-regression style): no component under
   `components/` or `app/(app)`/billing pages sets plan/entitlement state from
   URL params or localStorage (grep-based test).
5. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

None.

## Security and privacy requirements

- Webhook signature and idempotency tests must remain exactly as strict; any
  accidental weakening found = restore + record.

## Edge cases

- Timezone rendering of renewal dates in tests (fixed TZ in test env).

## Acceptance criteria

- [ ] Backend diff proof recorded (no semantic change).
- [ ] All legacy billing suites green unmodified.
- [ ] New UI assertions incl. the no-client-grant grep test.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Read the diff proof; run the webhook unit suite in isolation
(`yarn vitest run tests/unit/lemon-webhook.test.ts` equivalent).

## Required tests

As in steps 3–4; enumerate in report.

## Completion report

Report: diff proof, coverage delta, command results.

## Git checkpoint

`test(billing): regression coverage`

## Status update

Update `STATUS.md` (Phase 10 complete) and the 044 row in `INDEX.md`.
