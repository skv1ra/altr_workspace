# PROMPT 023 — Pricing page

## Current project state

Landing complete through privacy section (022). Legacy pricing at
`app/pricing/page.tsx` is functional (checkout entry, auth redirect) but
template-styled and English-only.

## Objective

Rebuild `/pricing` in the new visual system: Free / Personal ($20/mo) /
Work ($40/mo) with real plan limits, preserving the exact checkout behavior.

## Why this task exists

Pricing is the conversion surface; it must feel as premium as the hero while
keeping the audited billing contract byte-for-byte.

## Dependencies

022 (and design system).

## Files to inspect first

- `app/pricing/page.tsx` (current behavior: `/api/billing/plans`,
  `/api/billing/me`, checkout POST body `{planId}`, auth redirect with `next`)
- `lib/billing/plans.ts` (display names/prices), `lib/billing/limits.ts`
  (real limits per plan — the page must state these truthfully)
- e2e pricing tests in `tests/e2e/critical-flows.spec.ts`

## Files allowed to change

- `app/pricing/page.tsx` (rebuild), `components/site/PricingTable.tsx` (create)
- `lib/i18n/copy.ts` (pricing strings EN/UA; plan display names move to i18n —
  keep `lib/billing/plans.ts` values as the canonical amounts)
- `tests/e2e/critical-flows.spec.ts` (pricing selectors)
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/billing/**`, `lib/billing/**` (except reading), `supabase/`.

## Implementation instructions

1. Rebuild with three editorial columns (not rounded SaaS cards): plan name,
   price, one-line positioning, the real limits from `PLAN_LIMITS` (imports/mo,
   file size, memories, drafts/mo), and the CTA. Personal is visually primary.
2. Preserve behavior exactly: unauthenticated CTA → `/auth?next=/pricing`
   (matching the current e2e regex); authenticated → POST
   `/api/billing/checkout` with `{planId}` only; current-plan state shows a
   quiet "Your plan" instead of a dead button; Work↔Personal switch goes
   through checkout as today.
3. Answer plan-question footnotes honestly (cancellation via portal, no
   refund promises beyond `order_refunded` handling).
4. Update pricing e2e selectors to roles/testids while asserting the SAME
   request contracts. `yarn check` + `yarn test:e2e`.

## Visual requirements

Paper-light page, hairline column separators, obsidian primary CTA; numbers
typeset large and calm. No badges, no "most popular" ribbon — the visual
hierarchy itself signals Personal.

## Security and privacy requirements

- Client sends only `planId`; entitlement display comes from `/api/billing/me`;
  nothing on this page may imply payment success grants access.

## Edge cases

- `/api/billing/plans` unavailable → page renders with static display data and
  a quiet retry, CTAs disabled with visible reason (no dead buttons).
- User already on Work viewing Personal column.

## Acceptance criteria

- [ ] New pricing live with real limits and preserved contracts.
- [ ] e2e pricing + checkout-mock tests pass with updated selectors.
- [ ] EN + UA strings complete.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Walk both auth states (mocked); verify limits shown match `lib/billing/limits.ts`
exactly.

## Required tests

RTL: PricingTable renders limits from injected plan data; e2e updated.

## Completion report

Report: behavior-parity checklist, selector migrations, command results.

## Git checkpoint

`feat(site): premium pricing page`

## Status update

Update `STATUS.md` and the 023 row in `INDEX.md`.
