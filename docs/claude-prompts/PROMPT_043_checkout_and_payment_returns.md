# PROMPT 043 — Checkout and payment returns

## Current project state

Billing overview rebuilt (042). Legacy return surfaces: `/payment/success`
(with `PaymentConfirmation` polling component), `/payment/cancel`,
`/billing/return`, receipt page. The e2e suite pins "success page never
upgrades the plan".

## Objective

Rebuild the checkout entry touchpoints and all payment return pages in the new
system, preserving the security-critical "informational only" semantics.

## Why this task exists

The return pages carry the core billing invariant (#2); their redesign must
visibly communicate "confirming via webhook" without ever granting access.

## Dependencies

042.

## Files to inspect first

- `app/payment/success/page.tsx` + `PaymentConfirmation.tsx` (polling logic
  against `/api/billing/me` — the pattern to preserve), cancel + return pages
- Receipt page and its data source
- e2e: "payment success page never upgrades the plan",
  "checkout creation is mocked and sends only plan ID"

## Files allowed to change

- `app/payment/success/**`, `app/payment/cancel/page.tsx`,
  `app/billing/return/page.tsx`, `app/payment/receipt/[orderId]/page.tsx`
  (visual rebuild; polling/data logic preserved)
- `components/app/billing/` additions
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/billing/**`, `supabase/`.

## Implementation instructions

1. Success: cinematic confirmation-in-progress — "Payment received. Confirming
   your plan…" with the existing server-poll until entitlement flips (reuse the
   current polling logic verbatim or extract unchanged); explicit line
   preserved: activation happens only after verified confirmation. On
   confirmation → quiet arrival state with dashboard CTA. On timeout → honest
   "taking longer" state with support path, never an implied failure.
2. Cancel: no-blame copy, paths back to pricing and dashboard.
3. `/billing/return`: inspect its exact current role (Lemon Squeezy return
   target?) and preserve behavior under new skin.
4. Receipt: restyle with the invoice typography from 042.
5. Keep both pinned e2e semantics passing with migrated selectors.
   `yarn check` + `yarn test:e2e`.

## Visual requirements

The success moment deserves ceremony without dishonesty: slow fog bloom, the
plan name appearing when actually confirmed — the state machine visible in the
design (pending vs confirmed clearly distinct).

## Security and privacy requirements

- Return pages read entitlement solely from the server; no query-param trust
  (verify no code path reads success params to display plan state).
- Receipt shows only data the server route already exposes.

## Edge cases

- Success visited directly without a purchase (no pending sub) → neutral
  "no pending confirmation" state with billing link.
- Webhook delayed minutes; user closes tab and returns (resume polling).
- Cancel visited after a completed payment.

## Acceptance criteria

- [ ] All four surfaces rebuilt; polling/confirmation logic preserved.
- [ ] Pending vs confirmed states visually distinct and honest.
- [ ] Pinned e2e billing semantics green.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mock the poll sequence: pending → confirmed; pending → timeout; direct visit.
Screenshot each.

## Required tests

RTL: state machine rendering (pending/confirmed/timeout/direct). e2e: existing
two billing pins + cancel page render.

## Completion report

Report: `/billing/return` role findings, state screenshots list, command
results.

## Git checkpoint

`feat(billing): checkout and return pages`

## Status update

Update `STATUS.md` and the 043 row in `INDEX.md`.
