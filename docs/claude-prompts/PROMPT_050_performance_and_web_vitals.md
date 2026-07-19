# PROMPT 050 — Performance and Web Vitals

## Current project state

Visually approved (049).

## Objective

Verify and fix whole-application performance against the defined budget on
production builds.

## Why this task exists

The hero was gated in 018; the full app (dashboard bundles, route JS, fonts,
images) has not been budget-verified end to end.

## Dependencies

049.

## Files to inspect first

- `docs/claude-prompts/HERO_PERF_REPORT.md` (018 baseline)
- `next.config.js`; `yarn build` output (route-by-route JS sizes)
- Image/font assets across `public/`

## Files allowed to change

- Any application code/config for performance (code-splitting, dynamic imports,
  image sizing, preloads) that does not change behavior or visuals
- `docs/claude-prompts/PERF_REPORT.md` (create)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**` semantics, `lib/**` logic, `supabase/`, visual output (049 approval
must remain valid).

## Implementation instructions

1. Budgets (production build, median of 3, desktop + emulated mobile):
   - Landing: LCP < 2.5s (mobile emulated), CLS < 0.02, INP < 200ms,
     route JS ≤ 160 KB gzipped, hero assets within 018 tiers;
   - Auth/dashboard/memory/twin/billing routes: route JS ≤ 200 KB gzipped each,
     no route pulling the hero bundle;
   - Fonts: ≤ 2 files, subset, `font-display: swap`-safe without FOUT flash;
   - No unoptimized image over 250 KB shipped to any viewport.
2. Measure: `yarn build` size table + Lighthouse (mobile/desktop) on landing,
   pricing, auth, dashboard, memory, twin; record in `PERF_REPORT.md`.
3. Fix overruns: dynamic-import heavy components (hero already lazy per 017,
   dialogs, history lists), verify tree-shaking of lucide imports, audit any
   accidental client-side framer-motion in server-renderable components.
4. Re-verify CLS across journeys with throttled network.
5. `yarn check` + `yarn test:e2e` after changes; re-confirm 049 visuals
   unchanged (spot screenshots).

## Visual requirements

Zero visual regression tolerance — performance fixes must be invisible.

## Security and privacy requirements

- No third-party performance tooling added to the app; measurement is local.

## Edge cases

- Vercel-vs-local build differences (edge middleware size) — note, final
  verification repeats on Vercel in 051.

## Acceptance criteria

- [ ] `PERF_REPORT.md` with full metric × route table on production build.
- [ ] Every budget met or user-accepted with recorded reason.
- [ ] No visual/behavioral regressions (suites green + spot screenshots).
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn build`
- `yarn check`
- `yarn test:e2e`

## Manual verification

Throttled (Fast 3G) landing load watch: text readable immediately, no layout
jumps, nav usable during hero load.

## Required tests

None new; suites re-run.

## Completion report

Report: budget table with pass/fail, fixes applied, deferred items.

## Git checkpoint

`perf: meet performance budgets`

## Status update

Update `STATUS.md` and the 050 row in `INDEX.md`.
