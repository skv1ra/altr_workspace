# PROMPT 049 — Visual QA pass

## Current project state

Functionally complete and journey-tested (048).

## Objective

The visual quality gate: structured comparison of every surface against the
reference and DESIGN_DIRECTION, with fixes — "functional" is not "approved".

## Why this task exists

The mandate is an intentionally art-directed product; this is the prompt where
that is verified per screen, per breakpoint, per browser.

## Dependencies

048.

## Files to inspect first

- `references/altr-hero-reference.png`, `DESIGN_DIRECTION.md` (the rubric)
- STATUS.md screen ledger (complete list of surfaces)
- `docs/claude-prompts/A11Y_AUDIT.md` (fixes must not regress)

## Files allowed to change

- Any component/page/style (visual fixes), `public/` assets (refinements)
- `docs/claude-prompts/VISUAL_QA.md` (create — findings log)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/**` logic, `supabase/`, tests' semantic assertions.

## Implementation instructions

1. Rubric per surface (screenshot each at 1440 / 768 / 375, light of both
   ground types where applicable): composition and scale vs reference intent;
   typography (hierarchy, measure, rag); glass material realism (crack detail,
   edge highlights, reflection quality); fog and depth (foreground/background
   blur believability); motion restraint; button/control finish; spacing
   rhythm; empty/error/loading states styled; no template-feel regressions.
   Grade each surface pass / fix-needed with notes in `VISUAL_QA.md`.
2. Surfaces: hero (all three tiers), every landing section, pricing, legal,
   auth (all states), dashboard, onboarding, settings, import (lifecycle
   states), memory (list/editor/provenance), twin (config/draft/history),
   billing (all states), payment returns, privacy center, cookie surfaces,
   error/404/loading boundaries.
3. Browser sweep: Chromium, Firefox, WebKit (Playwright-rendered screenshots
   acceptable) — log rendering differences (backdrop-filter, AVIF, fonts) and
   fix or document.
4. Fix everything graded fix-needed; re-screenshot; attach final gallery paths
   in the report.
5. `yarn check` + `yarn test:e2e` after fixes.

## Visual requirements

This prompt IS the visual requirement. Approval bar: side-by-side with the
reference, the product looks like it shipped from the same studio.

## Security and privacy requirements

Screenshots use mocked fictional data only.

## Edge cases

- Firefox lacking backdrop-filter settings → verified fallback styling.
- Windows font rendering (ClearType) vs macOS — check weight appearance.

## Acceptance criteria

- [ ] `VISUAL_QA.md` grades every surface × breakpoint with evidence.
- [ ] Zero fix-needed items remaining (or user-accepted deferrals listed).
- [ ] Browser differences logged and resolved/accepted.
- [ ] `yarn check` and `yarn test:e2e` pass after fixes.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

User reviews the final screenshot gallery and grants visual approval — required
to proceed to 050.

## Required tests

None new (visual); regression suites re-run after fixes.

## Completion report

Report: grade summary, fixes applied, browser findings, gallery location,
user-approval status.

## Git checkpoint

`fix(design): visual QA corrections`

## Status update

Update `STATUS.md` (visual approval status) and the 049 row in `INDEX.md`.
