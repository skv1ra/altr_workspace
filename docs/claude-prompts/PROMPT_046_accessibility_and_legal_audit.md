# PROMPT 046 — Accessibility and legal audit

## Current project state

Privacy center live (045); public legal pages restyled (024).

## Objective

Close Phase 11: a structured accessibility audit across the rebuilt application
with fixes, and verification of all legal/consent surfaces and placeholders.

## Why this task exists

A premium product that fails keyboard users is not premium; legal surfaces
must be launch-ready per `docs/LEGAL_LAUNCH_CHECKLIST.md`.

## Dependencies

045, 024.

## Files to inspect first

- `tests/phase11-ux-a11y.test.ts` (existing baseline), `app/accessibility.css`
- `docs/LEGAL_LAUNCH_CHECKLIST.md`, `lib/legal/legal-config.ts` (placeholders)
- Every rebuilt screen (inventory from STATUS.md screen ledger)

## Files allowed to change

- Any rebuilt component/page (fix-level accessibility changes)
- `tests/**` (a11y assertions), `app/accessibility.css`
- `docs/claude-prompts/A11Y_AUDIT.md` (create — findings log)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`, `RISKS.md`

## Files that must not be changed

`app/api/**`, `lib/**` logic, `supabase/`, legal content files.

## Implementation instructions

1. Audit every rebuilt screen against a fixed checklist: keyboard-only
   operation and focus order; visible focus on both grounds; heading hierarchy;
   landmark structure; form labeling/error announcement; contrast (incl. text
   over fog/hero — measure); reduced-motion compliance; zoom 200% and 320px
   reflow; screen-reader pass on hero fragments, import lifecycle, draft view,
   deletion ceremony. Log every finding in `A11Y_AUDIT.md` with severity.
2. Fix all critical/serious findings now; minor ones fixed or explicitly
   deferred with reason.
3. Legal verification: every `legal-config.ts` placeholder enumerated with its
   fill-in status (user action items to STATUS.md); consent version display
   consistency; legal pages linked from footer + relevant flows; run
   `tests/phase10-legal-consistency.test.ts`.
4. Encode durable a11y assertions into tests (labels, roles, focus traps)
   where cheap.
5. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

Fixes must not degrade the design — accessible AND premium (e.g. focus rings
in silver, not default blue).

## Security and privacy requirements

None new.

## Edge cases

- Windows High Contrast mode (forced-colors): verify core flows legible.
- NVDA/VoiceOver differences noted where known (document, best-effort).

## Acceptance criteria

- [ ] `A11Y_AUDIT.md` complete with per-screen findings and resolutions.
- [ ] Zero unfixed critical/serious findings.
- [ ] Legal placeholder inventory recorded; consistency tests green.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

One complete keyboard-only journey: land → register (mock) → onboard → import
→ memory → draft → billing → privacy → sign out.

## Required tests

New durable a11y assertions (enumerate); existing a11y/legal suites green.

## Completion report

Report: findings statistics, fixes, deferred items with reasons, legal action
items for the user.

## Git checkpoint

`fix(a11y): accessibility and legal audit fixes`

## Status update

Update `STATUS.md` (Phase 11 complete; legal user-action items) and the 046
row in `INDEX.md`.
