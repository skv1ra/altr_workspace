# Risks

Ranked highest first. Every prompt that touches a risk area references it.

## R1 — Hero quality vs performance budget

The reference is photoreal. Real-time WebGL refraction cannot hit it within
budget; the hybrid approach (ADR-007) can miss "expensive" and land on "flat".
**Mitigation:** Prompt 012 prototype gate with explicit kill criteria; baked
lighting/crack detail in assets; DOF layer variants; Prompt 049 visual QA gate.
**Residual:** medium.

## R2 — Reference image (RESOLVED 2026-07-19) / port drift

The full-resolution reference is now verified at
`references/altr-hero-reference.png` and DESIGN_DIRECTION.md reflects the full
image. The residual risk in this slot is now **port drift**: a backend file
silently diverging from LEGACY during the Prompt 004 port.
**Mitigation:** PORT_MANIFEST.md with checksums for migrations; diff-proofs
against LEGACY `a22927d` in Prompts 035/041/044; ported test suites must pass
unmodified.
**Residual:** low.

## R3 — Frontend rewrite breaking API contracts silently

Rebuilt screens could drift from the exact request/response shapes the audited
routes expect (e.g. `rawFileStored: false` literal, strict zod schemas).
**Mitigation:** API routes are read-only in UI prompts; e2e mocks assert request
bodies; `yarn check` every session.
**Residual:** low.

## R4 — E2E suite coupled to Ukrainian strings

`tests/e2e/critical-flows.spec.ts` selects by Ukrainian headings/buttons; any
redesigned screen breaks its spec.
**Mitigation:** ADR-011 — each UI prompt migrates affected selectors to
role/testid queries in the same session; CI stays green per commit.
**Residual:** low.

## R5 — Entitlement/billing regression during UI rebuild

A redesigned pricing/billing surface that trusts client state would violate the
core security invariant.
**Mitigation:** webhook handler, entitlement policy, and payment-page tests are
untouchable; e2e "success page never upgrades plan" runs in Prompts 043/044.
**Residual:** low.

## R6 — CSP breakage from new assets/fonts

New fonts, images, or inline styles in the hero can violate the strict
nonce-based CSP in `middleware.ts`, failing silently in production only.
**Mitigation:** self-hosted fonts via next/font (ADR-009); Prompt 050 verifies
the production build with CSP active; no third-party origins added.
**Residual:** low.

## R7 — Import worker regression

The Web Worker pipeline is subtle (abort checkpoints, chunk batching, zip
limits). UI rebuild could re-wire it incorrectly.
**Mitigation:** worker and parsers are "must not change"; Prompt 035 runs the
full parser fixture matrix and mocked e2e import.
**Residual:** low.

## R8 — Migration discipline

One careless destructive migration breaks rollback (ADR-012 depends on additive
schema).
**Mitigation:** ADR-002; the only new migration in the plan (onboarding flag,
Prompt 031) is additive with RLS.
**Residual:** low.

## R9 — Scope creep from roadmap features

Operator/Negotiator previews and roadmap phases could leak into the rebuild as
half-built screens (dead buttons — explicitly forbidden).
**Mitigation:** FEATURE_PARITY_MATRIX marks them ROADMAP; prompts only allow
clearly-labeled non-interactive future modules.
**Residual:** low.

## R10 — Windows dev environment vs CI

Local shell is Windows (PowerShell/Git Bash); CI is Linux. Path casing, line
endings, and worker bundling can differ.
**Mitigation:** rely on CI as the gate; `.prettierrc` + eslint enforce endings;
no shell-specific scripts added to package.json.
**Residual:** low.

## R11 — Duplicate plan-price definitions (found 2026-07-19, Prompt 002)

`lib/billing/plans.ts` (entitlement-authoritative, cents) and `lib/plans.ts`
(pricing-page display, dollars) both hardcode the same $20/$40 figures
independently — confirmed both are live and imported (not dead code). A price
change applied to one and not the other would silently desync the marketing
pricing page from actual billing/entitlements.
**Mitigation:** consolidate to a single source of truth for price figures
when Prompt 023 (pricing page) and/or Prompt 004 (backend port) touch this
area — e.g. derive the display dollar amount from the cents constant instead
of duplicating it.
**Residual:** low (no current desync found; risk is future drift).

## R12 — MASTER_CONTEXT.md security-invariant citation gap (found 2026-07-19, Prompt 002)

MASTER_CONTEXT.md invariant #3 ("server-only keys guarded by
`tests/security-regression.test.ts`") is inaccurate: that test file does not
reference `SERVICE_ROLE_KEY` or `OPENAI_API_KEY` at all. The guarantee itself
holds (verified structurally via `lib/env.ts`'s `getServerEnv`/`getPublicEnv`
split and `NEXT_PUBLIC_` convention — see FEATURE_PARITY_MATRIX.md §
"Verified invariants" #3), but the cited enforcement mechanism is wrong.
**Mitigation:** MASTER_CONTEXT.md is outside Prompt 002's allowed-files
scope; correct the citation the next time a prompt is allowed to edit it
(or ask the user to approve a direct fix), and consider adding an actual
test assertion for this invariant rather than relying on structural
convention alone.
**Residual:** low (documentation accuracy only; no real security gap).

## R13 — Manual memory creation/reactivation does not enforce `maxActiveMemories` server-side (found 2026-07-24, Prompt 038)

Read, not assumed: `app/api/memories/route.ts`'s `POST` handler inserts a new
`altr_memories` row straight from the parsed body with no active-count check
at all. `app/api/memories/[id]/route.ts`'s `PATCH` handler (used both for
edits and for the row-level enable/disable toggle) is the same — setting
`active: true` on a previously-disabled memory has no quota check either.
This is a real gap, not a stylistic one: `lib/ai/memory-extraction.ts`'s own
extraction path *does* enforce the identical limit (`activeMemories.count >=
limits.maxActiveMemories` before inserting, and again per-candidate inside
its insert loop), so the two memory-creation paths in this app currently
behave inconsistently — one honors `PLAN_LIMITS[plan].maxActiveMemories`,
the other doesn't.
**Mitigation:** Prompt 038 added UI-only gating in `MemoryEditDialog`
(`components/app/memory/`) — the create form shows a calm quota-reached
notice with the real `used`/`limit` numbers and disables the Save button
once `activeMemoryCount >= memoryLimit` — but this is UX-only, exactly per
this prompt's own "UI gating is UX only" requirement. A direct API call to
`POST /api/memories` or `PATCH /api/memories/:id` (`{"active": true}`)
still succeeds unconditionally past the plan limit; two browser tabs
racing the same limit would also both succeed. Real server-side enforcement
(mirroring `memory-extraction.ts`'s own check) should be added to both
routes in a future prompt — not done here, since `app/api/**` is outside
Prompt 038's allowed-files list and the prompt's own instructions
explicitly say not to add it silently.
**Residual:** low (no auth/data-exposure impact — a user can only ever
over-fill their *own* memory store; the promised plan ceiling is
UX-enforced, not hard-enforced, for these two paths only).

## R14 — `PricingTable.tsx` derives "current plan" from `effectivePlan` alone, never `hasPremium`/`entitlementReason` (found 2026-07-25, Prompt 044)

Read, not assumed: `GET /api/billing/me` (`app/api/billing/me/route.ts`)
returns all three fields — `effectivePlan`, `hasPremium`, and
`entitlementReason` — but `components/site/PricingTable.tsx`'s own local
`BillingMeResponse` interface declares only `effectivePlan`, and its
`isCurrentPlan = me != null && me.effectivePlan === planId` (line ~182)
never reads the other two. Prompt 042 already established that
`effectivePlan` is a display label that can remain stale/non-gating after
real access lapses (grace period expiry, `past_due` past grace, etc.) —
`hasPremium`/`entitlementReason` are the fields that reflect actual,
current access. Consequence: a user whose subscription has genuinely
lapsed would still see the quiet, non-actionable "Your plan" label for
their old paid tier on `/pricing` instead of a working resubscribe
checkout button — a real UX/revenue gap (a churned or grace-expired user
can't easily resubscribe from the pricing page), though not a security
gap (no client trusts this for actual gating; it only decides which
button `PricingTable` shows).
**Mitigation:** not fixed here — `components/site/PricingTable.tsx` is
outside Prompt 044's allowed-files list (`components/app/billing/` only).
A future prompt touching this file should change `isCurrentPlan` to key
off `hasPremium`/`entitlementReason` (e.g. only suppress the checkout CTA
when `hasPremium` is true for that plan) instead of the raw label.
**Residual:** low (no security/entitlement-trust impact — confirmed via
`tests/unit/no-client-entitlement-trust.test.ts`, added in this same
prompt, that no component ever *grants* access from client state; this is
a CTA-correctness gap only).

## R15 — `lib/legal/deletion-content.ts` still describes deletion as an unproven browser-only prototype (found 2026-07-25, Prompt 045)

Read, not assumed, while building `/data-deletion`: the must-not-change
content in `lib/legal/deletion-content.ts` states "The supplied website
is a browser-only prototype. Its deletion tool can remove Altr data from
the current browser, but it cannot prove deletion from a future
production database, AI provider, payment system, backups, email
service, or connected platform until those systems are implemented," and
separately that "Signed-in users can open /delete-data, review the
scope, type the confirmation word, and delete browser-prototype data."
Both statements predate Prompt 004's real backend port — this workspace
now has a genuinely working, audited `DELETE /api/privacy/account` (real
anonymization/storage-cleanup/audit-trail pipeline, verified by reading
the route in full this session) and `POST /api/privacy/deletion-
requests` (real server-recorded requests), neither of which is a browser-
only local-storage prototype. A user reading this policy page would be
told their deletion request cannot be proven or trusted, when the real
mechanism underneath now can be.
**Mitigation:** not fixed here — `lib/legal/**` content is explicitly
must-not-change for this prompt; `/data-deletion` renders this content
verbatim (`components/app/privacy/DeletionPolicyContent.tsx`). A future
prompt with `lib/legal/deletion-content.ts` in its allowed-files list
should update this section to describe the real, current deletion
mechanism.
**Residual:** low (a documentation-accuracy gap, not a functional one —
the real deletion mechanism itself is correct and unaffected; users are
undersold on trust, never oversold).

## R16 — `DELETE /api/me` / `lib/auth.ts`'s `deleteCurrentAccount()` is a dead, structurally weaker duplicate of the real account-deletion path (found 2026-07-25, Prompt 045)

Read, not assumed: `app/api/me/route.ts`'s own `DELETE` handler exists
alongside the real, audited `DELETE /api/privacy/account`
(`app/api/privacy/account/route.ts`) — but the two are not equivalent.
The `/api/me` path only requires a literal `"DELETE"` confirmation
string, has no email-match or recent-authentication check, and its own
deletion logic is a single direct `admin.auth.admin.deleteUser(user.id)`
call with **no** anonymization of billing/order/invoice records, no
private-storage cleanup, and no `altr_deletion_requests`/
`altr_deletion_request_history` audit trail — everything
`/api/privacy/account` does deliberately, in that order, before deleting
the Auth user. `lib/auth.ts`'s own `deleteCurrentAccount()` client helper
calls this weaker route. Confirmed via a repo-wide grep that
`deleteCurrentAccount` has **zero callers anywhere** in this workspace —
fully dead code today, not currently reachable from any UI — but it
sits ready to be wired up by a future prompt that reasonably assumes
"the" account-deletion function already exists in `lib/auth.ts` (the
same file `signOutAccount`/`updateCurrentProfile`/etc. all live in),
without realizing it bypasses every real deletion safeguard.
**Mitigation:** this prompt's own new account-deletion ceremony
(`components/app/privacy/useAccountDeletion.ts`) calls `/api/privacy/
account` directly, never `deleteCurrentAccount()` — verified by grep
before writing this entry. Not removed here — `app/api/**` and
`lib/auth.ts` are both outside Prompt 045's allowed-files list. A future
prompt that can touch both files should either delete the dead
`/api/me` `DELETE` handler and `deleteCurrentAccount()` entirely, or
make `/api/me`'s handler delegate to the same real logic
`/api/privacy/account` uses, so no second, weaker path can ever be
accidentally wired up.
**Residual:** low today (unreachable from any UI, confirmed by grep —
no active exploit path), but genuinely medium if a future prompt wires
it up without reading this entry first: a user who somehow triggered
that path would believe their account was fully, safely deleted while
billing/order records were never anonymized and no audit trail exists.
