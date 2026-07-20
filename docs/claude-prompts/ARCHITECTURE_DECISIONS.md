# Architecture decisions

Binding for all prompts. Each record: decision, alternatives, reason, risks, mitigation.

## ADR-001 — Build from scratch in `altr_workspace`, port the proven backend

- **Decision:** The new application lives in `skv1ra/altr_workspace` (WORKSPACE),
  built from scratch on branch `main`. `skv1ra/altrtest2` (LEGACY, local
  read-only checkout at `C:\Users\golyb\altrtest2`, pinned audit SHA `a22927d`)
  is inspection-only. Proven backend behavior — API route handlers, `lib/`
  domain logic, `supabase/` migrations and RLS, `workers/`, scripts, and non-UI
  tests — is ported into WORKSPACE deliberately (bulk platform/backend port in
  Prompt 004, reviewed line by line, verified by the ported test suites). The
  frontend is never copied: pages, components, and styles are designed new,
  with LEGACY used to confirm behavior, contracts, and parity.
- **Alternatives:** (a) in-place rebuild on a branch of altrtest2 (the original
  plan); (b) re-implementing the backend from specs without porting.
- **Reason:** The user designated altr_workspace as the product repository and
  altrtest2 as read-only reference. Porting (not re-implementing) the backend
  preserves the audited security properties — RLS, verified webhooks,
  entitlements, import safety, AI boundary — with the tests that prove them.
- **Risks:** Port drift (a file silently diverging from LEGACY during copy);
  accidental writes to the LEGACY checkout.
- **Mitigation:** Ported files are diff-verified against LEGACY `a22927d`
  (test prompts 035/041/044 formalize this); LEGACY is in every prompt's
  "must not be changed" scope; commits/pushes target altr_workspace only.

## ADR-002 — Legacy migrations ported verbatim; append-only thereafter

- **Decision:** LEGACY's `supabase/migrations/` (15 files), `schema.sql`, and
  the RLS verification SQL are ported into WORKSPACE byte-identical in
  Prompt 004. The same Supabase project remains the database, so existing user
  data stays compatible by construction. From then on, migrations are
  append-only: never edit or delete a ported file; schema changes (e.g. the
  onboarding flag) are new timestamped migrations with RLS policies.
- **Alternatives:** squashing history into one fresh schema for the new repo.
- **Reason:** The production database already ran these migrations; squashing
  or re-authoring breaks the deployed schema and its data.
- **Risks:** Port typos corrupting a migration; drift between environments.
- **Mitigation:** byte-identical port verified by checksum against LEGACY;
  `schema.sql` regenerated after any new migration; RLS SQL re-run (Prompt 047).

## ADR-003 — Authentication is ported, not re-invented

- **Decision:** Same Supabase project; the `@supabase/ssr` clients
  (`lib/supabase/{client,server,admin,middleware}.ts`), auth API routes, and
  `middleware.ts` are ported verbatim from LEGACY (Prompt 004). Only the auth
  UI is designed new. Existing users and sessions are untouched.
- **Alternatives:** new auth provider; custom auth; re-implementing from docs.
- **Reason:** Zero-risk parity; Supabase Auth is the identity source of truth.
- **Risks:** UI rewrite breaking redirect/`next` param flows.
- **Mitigation:** Prompt 027/028 explicitly test redirects, callback, and sign-out.

## ADR-004 — Billing compatibility

- **Decision:** Port the Lemon Squeezy integration exactly as-is: same store,
  variants, webhook route path (`/api/webhooks/lemonsqueezy`), signature
  verification, idempotency table, and entitlement policy. Entitlement state
  continues to be computed server-side from `altr_subscriptions` + policy in
  `lib/billing/entitlement-policy.ts`.
- **Alternatives:** Stripe; client-cached entitlements.
- **Reason:** Live subscriptions must keep working; the webhook path is registered
  in the Lemon Squeezy dashboard.
- **Risks:** Redesigned pricing/billing UI implying entitlement client-side.
- **Mitigation:** e2e test "payment success page never upgrades the plan" is kept
  and must pass in every billing prompt.

## ADR-005 — Conversation imports stay browser-local

- **Decision:** Port the Web Worker parse pipeline, ZIP safety limits, sha-256
  duplicate detection, chunked persistence, and `rawFileStored: false` verbatim
  into WORKSPACE. Only the import UI/UX is designed new.
- **Alternatives:** server-side parsing (upload archives).
- **Reason:** Privacy property "raw archives never leave the browser" is a product
  promise and a legacy behavior we must retain.
- **Risks:** New UI regressing worker wiring.
- **Mitigation:** import e2e + parser unit tests must pass unchanged (Prompt 035).

## ADR-006 — Language: English primary, EN/UA switcher preserved

- **Decision:** All new screens ship in English first. The existing `LanguageSwitcher`
  and `lib/i18n` copy stores are kept and extended so UA remains selectable; mixed
  hardcoded Ukrainian strings are migrated into the copy store as screens are rebuilt.
- **Alternatives:** drop UA; full i18n framework (next-intl).
- **Reason:** The legacy product is bilingual (parity), but current coverage is
  inconsistent; a heavyweight i18n framework is out of scope for the rebuild.
- **Risks:** e2e tests assert Ukrainian strings today.
- **Mitigation:** Prompts that change a screen must update its e2e selectors to
  role/testid-based queries in the same session.

## ADR-007 — Hero implementation: Option C hybrid (pre-rendered fragments + lightweight real-time layers)

- **Decision:** The hero is built from high-quality pre-rendered raster glass-shard
  assets (transparent PNG/WebP with baked lighting, cracks, and blur variants)
  composed in layered DOM/CSS with: multi-layer pointer/scroll parallax, CSS
  depth-of-field (pre-blurred foreground/background variants), fog gradients, a
  tiny canvas particle layer, and Framer Motion for slow drift. Memory-fragment
  content (voice memo, message excerpt, dates, waveform) renders as HTML overlays
  aligned to shards. No Three.js / React Three Fiber dependency.
- **Alternatives:** (a) full R3F WebGL scene with refractive glass materials;
  (b) pre-rendered video background.
- **Reason:** Real-time refraction/dispersion at the reference's photoreal quality
  requires heavy shaders + HDRI and routinely fails the 60 FPS + mobile + CLS
  budget; the repo already has a raster-shard pipeline
  (`scripts/generate-hero-shards.mjs`, `public/hero-shards/`). Video blocks
  interactive per-shard content and costs mobile data. Layered raster gives
  reference-grade materials at near-zero runtime cost, keeps text as real HTML
  (accessible, selectable, SEO), and degrades gracefully.
- **Risks:** Parallax-only depth can feel flat; asset weight.
- **Mitigation:** Prompt 012 builds a comparative prototype and formally confirms
  or amends this ADR before Phase 3 continues; strict asset budget (≤ 900 KB
  hero imagery on desktop, ≤ 350 KB mobile, AVIF/WebP with PNG fallback);
  scale/rotation micro-motion + DOF layer swaps to sell depth.

- **Prompt 012 resolution (2026-07-20): CONFIRMED technically, on the
  approach — NOT yet visually approved as final.** Built `/hero-lab`
  (`components/hero/`) using LEGACY's 6 shard PNGs, canvas particle dust,
  pointer parallax, and `lib/motion` drift. Measured on desktop Chrome via
  Playwright (dev server — `next start` also 404s this dev-only route, so
  dev mode was the only reachable target; noted as a measurement caveat,
  not expected to be worse than production in practice):

  | Kill criterion | Target | Measured | Result |
  | --- | --- | --- | --- |
  | Sustained FPS during pointer interaction | ≥ 55 | avg 60.3, p95 59.5 | PASS |
  | Hero asset weight (desktop) | ≤ 900 KB | 186.5 KB (6 requests, `next/image` WebP) | PASS |
  | CLS contribution | 0 | 0 (measured via PerformanceObserver) | PASS |
  | Visual credibility (user judgment) | same material family as reference | **not approved — see below** | PENDING |

  Raw LEGACY PNGs sum to 1.8 MB; the 186.5 KB figure is what `next/image`
  actually delivers (resized + WebP) at real display sizes — the raw sum
  was not representative of delivered weight.

  **Technique tried and rejected on data, not aesthetics:** a CSS
  `mask-image`-clipped diagonal sheen (to fake a glossy reflection,
  confined to each shard's own alpha silhouette) required the browser to
  fetch the *raw* PNGs as mask sources — `mask-image` bypasses
  `next/image`'s optimization entirely. Measured effect: hero weight
  186.5 KB → 1.9 MB, avg FPS 60.3 → 25.8 (p95 20), 91 long tasks during
  the interaction window (vs. 2, both load-time, without it). Removed;
  confirmed all three quantitative criteria returned to the passing
  numbers above once removed. Record this so nobody retries the same
  masking trick as an "easy" glass-reflection shortcut later — it isn't
  free, and any future glass-enhancement compositing must not depend on
  fetching full-resolution alpha channels as CSS masks.

  **User visual review (two rounds) found the material does not yet read
  as photoreal dark glass** — reads closer to matte dark rock than the
  reference's glossy, refractive shards with fine bright fracture veins.
  Composition/fog/depth-layering/rim-light were iterated via CSS alone
  (repositioned shards for stronger depth cinematography, brightened fog
  left-of-center, added a contrast/brightness/drop-shadow rim-light pass,
  added the memory-fragment HTML etching) and the user confirmed those
  layout/atmosphere changes are heading the right direction — but true
  glossy reflection/refraction and finer crack-vein geometry are baked
  into the source PNG pixels and cannot be manufactured with CSS on top
  of the existing LEGACY assets. **Conclusion: the limiting factor is now
  asset quality, not layout/compositing tuning — no further micro-tuning
  of the current LEGACY-pixel prototype is planned.** The hybrid
  *technical* approach (raster shards + DOM/CSS compositing, no WebGL) is
  confirmed and stands; the *assets themselves* need regenerating at
  higher fidelity, which is Prompt 013's job. `/hero-lab` stays in the
  repo (dev-only, 404s in production) as the base Phase 3 iterates on
  once new assets exist — it is not being rebuilt from scratch.

## ADR-008 — Mobile and reduced-motion degradation

- **Decision:** Mobile gets a simplified composition: fewer shards, no pointer
  parallax (subtle scroll drift only), smaller assets via `srcset`/`<picture>`.
  `prefers-reduced-motion` disables all drift/parallax and shows the fully
  composed static scene. A no-JS/older-browser fallback is a single composed
  static image with the same HTML headline/CTA on top. Navigation, headline, and
  CTA never depend on hero assets loading (reserved layout, zero CLS).
- **Alternatives:** hiding the hero on mobile.
- **Reason:** Performance budget and accessibility requirements.
- **Risks:** Divergent art quality between tiers.
- **Mitigation:** Visual QA prompt (049) reviews all three tiers explicitly.

## ADR-009 — Design tokens

- **Decision:** Tokens live as CSS custom properties in `app/styles/tokens.css`
  (color, type scale, spacing, radii, shadows, materials, motion durations/easings),
  mapped into `tailwind.config.ts` so utilities and tokens stay in sync. Fonts are
  self-hosted via `next/font` (CSP stays `font-src 'self' data:`).
- **Alternatives:** Tailwind-config-only tokens; CSS-in-JS.
- **Reason:** Custom properties work in plain CSS (hero scene, module CSS) and
  Tailwind simultaneously; self-hosting preserves the strict CSP in `middleware.ts`.
- **Risks:** Token drift between CSS and Tailwind.
- **Mitigation:** single source file, Tailwind reads `var(...)` references.

## ADR-010 — AI context retrieval unchanged

- **Decision:** Keep embedding-based retrieval exactly as implemented: OpenAI
  embeddings (1536) → `altr_match_active_memories` RPC (threshold 0.68, top 8)
  → last 12 conversation messages → JSON-wrapped untrusted context.
- **Alternatives:** new retrieval stack.
- **Reason:** Proven, tested, injection-hardened.
- **Risks:** none new.
- **Mitigation:** phase12 AI privacy tests stay green.

## ADR-011 — Test structure

- **Decision:** Keep Vitest (unit/integration/component) + Playwright (mocked
  e2e in CI, `ALTR_E2E_MOCKS=1`). Prompt 004 ports the test infrastructure
  (configs, setup, e2e-auth helper, fixtures) and all non-UI suites from LEGACY;
  UI-coupled legacy tests are ported and adapted by the prompt that builds the
  corresponding screen. New UI gets RTL tests under `tests/`; e2e selectors use
  accessible role/testid queries. The LEGACY CI pipeline is ported and extended.
- **Alternatives:** Jest, Cypress; re-authoring all tests from scratch.
- **Reason:** The LEGACY suites encode the audited contracts — porting them is
  the parity gate in executable form.
- **Risks:** e2e drift during redesign; UI-coupled suites left behind.
- **Mitigation:** every UI prompt ports/adapts its specs in the same session;
  Prompt 047 audits for unported suites.

## ADR-012 — Staging vs production, deployment, rollback

- **Decision:** Vercel, with the project bound to `skv1ra/altr_workspace`.
  Work lands on `main` in prompt-sized commits; per-commit/branch Preview
  deployments act as staging with test-mode Lemon Squeezy
  (`LEMONSQUEEZY_TEST_MODE=true`) and a staging Supabase project when available.
  Production promotion happens only after Prompt 051's smoke test passes on a
  preview. Rollback = Vercel "instant rollback" to the previous deployment;
  because migrations are append-only and additive (ADR-002), a previous build
  remains compatible with the current schema. The legacy Vercel project (if any)
  serving altrtest2 is left untouched.
- **Alternatives:** separate staging project; long-lived release branch.
- **Reason:** Matches the ported `vercel.json` + docs; minimal moving parts.
- **Risks:** additive-only discipline broken by a careless migration; deploys
  accidentally wired to the wrong repo.
- **Mitigation:** ADR-002 rule in every prompt's "must not change" list;
  Prompt 051 verifies the Vercel project's linked repository is altr_workspace.

## ADR-013 — The workspace grows feature-complete, never half-wired

- **Decision:** WORKSPACE contains no legacy screens; the application grows
  screen by screen as prompts land. A route, nav entry, or button ships only
  when its feature actually works end to end in WORKSPACE — otherwise it does
  not appear at all. Every commit keeps `yarn check` green; ported backend
  routes may exist before their UI does (they are exercised by ported tests).
- **Alternatives:** scaffolding all routes upfront with placeholder screens.
- **Reason:** The mandate forbids dead buttons and placeholder-quality UI; an
  absent screen is honest, a stub screen is not.
- **Risks:** temporarily incomplete navigation during the build window.
- **Mitigation:** phases ordered public → auth → app; STATUS.md's screen ledger
  tracks which screens exist at any time; the parity matrix gates completion.
