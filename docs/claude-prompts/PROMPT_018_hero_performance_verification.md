# PROMPT 018 — Hero performance verification

## Current project state

Hero complete with all tiers in `/hero-lab` (017). Not yet on the homepage.

## Objective

Formally verify the hero against the performance budget and produce the
measurement record that gates Phase 4 integration.

## Why this task exists

RISKS R1 closure. Integration (020) is forbidden until budgets are met with
recorded numbers.

## Dependencies

017.

## Files to inspect first

- `components/hero/` final implementation
- ADR-007 budgets; PERFORMANCE targets in Prompt 050 (same numbers apply)

## Files allowed to change

- `components/hero/` (performance fixes only — no visual redesign)
- `docs/claude-prompts/HERO_PERF_REPORT.md` (create)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Everything else. If a fix requires asset changes, loop with the 013 pipeline
inside this session and record it.

## Implementation instructions

1. Production build (`yarn build`, `yarn start`) — measure on `/hero-lab`:
   - LCP element and time (target: headline text, < 2.0s local desktop);
   - CLS (target 0.00);
   - FPS during pointer+scroll (≥ 55 desktop);
   - hero JS added to the route (target ≤ 35 KB gzipped beyond framework);
   - image bytes actually transferred per tier (≤ 900 KB / ≤ 350 KB);
   - main-thread long tasks during load (< 200ms total).
2. Lighthouse run (mobile + desktop presets) on the lab route; save scores.
3. Fix regressions found; re-measure; iterate until green or honestly document
   an unmet target with cause and proposed remedy — do NOT lower a target
   silently.
4. Write `HERO_PERF_REPORT.md` with the full table, tool, and date.

## Visual requirements

No visual changes allowed except those invisible at 1x zoom (compression tuning).

## Security and privacy requirements

None new.

## Edge cases

- Local measurement variance: take median of 3 runs.
- Dev-only route overhead: measure with production build only.

## Acceptance criteria

- [ ] All six metrics measured on a production build, median of 3 runs.
- [ ] Every target met, or an unmet target documented with cause + remedy plan.
- [ ] `HERO_PERF_REPORT.md` committed.
- [ ] `yarn check` passes.

## Verification commands

- `yarn build`
- `yarn check`

## Manual verification

User reviews HERO_PERF_REPORT.md and approves Phase 4 integration.

## Required tests

None new; report is the artifact.

## Completion report

Report: metric table, fixes applied, any unmet targets and their plan.

## Git checkpoint

`perf(hero): verify hero performance budget`

## Status update

Update `STATUS.md` (Phase 3 complete or blocked) and the 018 row in `INDEX.md`.
