# PROMPT 048 — E2E flow update

## Current project state

Unit/integration base expanded (047). The e2e spec has been updated per-screen
during rebuild prompts; it needs consolidation into a coherent journey suite.

## Objective

Consolidate and extend the Playwright suite into complete mocked user journeys
across the rebuilt application, runnable credential-free in CI.

## Why this task exists

Per-prompt selector patches keep tests green but fragment intent; the release
gate needs journey-level confidence.

## Dependencies

047.

## Files to inspect first

- `tests/e2e/critical-flows.spec.ts` (current state after all migrations),
  `playwright.config.ts`, `lib/testing/e2e-auth.ts`, `ALTR_E2E_MOCKS` wiring
- `.github/workflows/ci.yml` e2e step

## Files allowed to change

- `tests/e2e/**` (restructure into journey files allowed), `playwright.config.ts`
  (projects/timeouts only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Application code (fix-level changes only if a test finds a real bug — separate
commit), `lib/testing/e2e-auth.ts` semantics.

## Implementation instructions

1. Restructure into journeys: visitor (landing → pricing → auth redirect),
   new user (register validation → onboarding → empty dashboard), import
   journey (fixture import incl. duplicate + quota mocks), memory journey
   (CRUD + clear-all ceremony), twin journey (config + draft + errors +
   history), billing journey (checkout contract, success-never-upgrades,
   overview states), privacy journey (consents, export trigger, deletion
   ceremony gate), sign-out. Preserve every pinned legacy assertion (request
   bodies, redirect URLs).
2. Add viewport coverage: run the visitor + new-user journeys in a mobile
   project (375px) too.
3. Stabilize: role/testid selectors only, no text-locale coupling, explicit
   waits on real signals (no arbitrary timeouts).
4. Verify total runtime stays CI-reasonable (< ~10 min).
5. `yarn check` + `yarn test:e2e` (all journeys, both projects).

## Visual requirements

None (screenshot comparison belongs to 049).

## Security and privacy requirements

- Mocks only; the suite must never require or contain real credentials.
- Keep the security-semantic pins (never-upgrades, plan-id-only checkout,
  protected redirects) named clearly so they are hard to delete casually.

## Edge cases

- Playwright flake from motion: disable animations via reduced-motion emulation
  in tests where assertions are content-based.
- Windows local runs vs CI Linux paths.

## Acceptance criteria

- [ ] Journey suite covers all eight journeys + mobile project.
- [ ] All legacy security pins preserved and passing.
- [ ] No locale-coupled selectors remain.
- [ ] Runtime recorded; `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Review the journey list against FEATURE_PARITY_MATRIX "Manual check" column —
every 048-referencing row must be exercised.

## Required tests

The journey suite itself.

## Completion report

Report: journey inventory, pins preserved, runtime, flake notes.

## Git checkpoint

`test(e2e): rebuilt critical flows`

## Status update

Update `STATUS.md` and the 048 row in `INDEX.md`.
