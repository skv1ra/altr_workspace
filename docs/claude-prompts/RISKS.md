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
