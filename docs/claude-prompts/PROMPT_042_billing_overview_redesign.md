# PROMPT 042 — Billing overview redesign

## Current project state

Twin phase complete (041). Legacy `/billing` page shows subscription status,
invoices, portal access via `/api/billing/me` and `/api/billing/portal`;
receipt page at `/payment/receipt/[orderId]`.

## Objective

Rebuild the billing overview inside the app shell: current plan, subscription
state, invoice/order history, and Customer Portal access.

## Why this task exists

Parity for COMPLETE billing surfaces with the new visual standard; money
surfaces must be the most trustworthy-looking in the app.

## Dependencies

029; 023 (pricing exists for upgrade paths).

## Files to inspect first

- `app/billing/page.tsx` (current data usage), `/api/billing/me` payload
  (effectivePlan, subscription, invoices…) — enumerate actual fields
- `/api/billing/portal` (POST → portalUrl; 404 SUBSCRIPTION_NOT_FOUND for free)
- `app/payment/receipt/[orderId]/page.tsx` (keep working; restyle in 043)
- `lib/billing/plans.ts` display data; PlanBadge/QuotaMeter (031)

## Files allowed to change

- `app/billing/page.tsx` (rebuild), `components/app/billing/` (create)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/billing/**`, `app/api/webhooks/**`, `lib/billing/**`, `supabase/`,
payment return pages (043).

## Implementation instructions

1. Plan panel: current plan (PlanBadge), renewal/cancellation state from real
   subscription fields (status, renews_at/ends_at as present in the payload —
   verify names), quota summary rows reusing QuotaMeter.
2. Actions by state: Free → "Choose a plan" (`/pricing`); active sub →
   "Manage subscription" (POST portal → open fresh URL) with pending state;
   cancelled-but-active → honest countdown copy + resubscribe path via pricing.
3. Invoice/order history: editorial table (date, description, amount,
   status, receipt link to the existing receipt route); designed empty state
   for free users.
4. Failed-payment state: if the subscription payload exposes past_due status,
   render a calm alert with portal path (verify actual status values in
   entitlement policy).
5. `yarn check` + `yarn test:e2e`.

## Visual requirements

Financial data typeset like a fine invoice: tabular numerals, hairline rules,
no color-coded chips (status as typographic states).

## Security and privacy requirements

- Display only server-provided state; no entitlement math client-side.
- Portal URLs are fresh per click (server behavior) — never cached/rendered
  as static hrefs.

## Edge cases

- Free user clicking portal (404) — path hidden for free users; if reached,
  designed explanation.
- Multiple historical subscriptions; zero invoices with active sub (webhook
  timing) → "receipt on its way" state.

## Acceptance criteria

- [ ] Overview live with all real states (free/active/cancelled/past-due as
      supported by the payload).
- [ ] History table + receipt links working.
- [ ] Portal flow with pending state working.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mock each subscription state and walk the actions; 375px table behavior.

## Required tests

RTL: state-dependent action rendering, history table, portal pending. e2e:
billing overview with mocked `/api/billing/me`.

## Completion report

Report: payload field mapping table, states covered, command results.

## Git checkpoint

`feat(billing): redesigned billing overview`

## Status update

Update `STATUS.md` and the 042 row in `INDEX.md`.
