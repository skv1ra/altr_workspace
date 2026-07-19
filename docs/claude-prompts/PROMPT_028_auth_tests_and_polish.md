# PROMPT 028 — Auth tests and polish

## Current project state

All auth surfaces rebuilt (025–027).

## Objective

Close Phase 5: full test coverage of the rebuilt auth experience and a polish
pass (micro-interactions, copy, edge states) to the visual quality gate.

## Why this task exists

Auth regressions are account-loss regressions; the phase cannot close on
"probably works".

## Dependencies

027.

## Files to inspect first

- All `components/auth/` and rebuilt auth pages
- Existing auth tests: `tests/unit/auth-validation.test.ts`, auth e2e blocks
- `DESIGN_DIRECTION.md` quality bar

## Files allowed to change

- `tests/**` (auth-related additions/updates)
- `components/auth/**`, auth pages (polish-level changes only)
- `lib/i18n/copy.ts` (copy refinement)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/auth/**`, `lib/auth/validation.ts`, `lib/supabase/**`, `middleware.ts`,
`supabase/`.

## Implementation instructions

1. Coverage audit: list every auth behavior (register validation, login errors,
   429, mode switch, next-propagation, forgot neutral response, reset states,
   callback redirects, protected redirect, sign-out) against existing tests;
   write the missing ones (RTL for components, e2e for flows — mocked).
2. Polish pass with the styleguide open: focus order, tab flow, autofill
   appearance, submit micro-interaction, error-state transitions, UA copy
   completeness. Fix everything found; keep a list.
3. Verify no Ukrainian hardcoded strings remain in auth surfaces (all via i18n).
4. Full gate: `yarn check` + `yarn test:e2e`.

## Visual requirements

Auth screens pass the "premium hardware brand" credibility test side-by-side
with the landing; identical material family, no orphan styles.

## Security and privacy requirements

- Tests must not embed real credentials; mocks only.
- Confirm no test weakens or skips a security assertion to pass.

## Edge cases

- Password managers (1Password/Chrome) filling both fields.
- Browser back after successful login.
- Double-click on submit.

## Acceptance criteria

- [ ] Coverage list complete; every auth behavior has a test.
- [ ] Polish findings list produced and resolved.
- [ ] Zero hardcoded-locale strings in auth surfaces.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Full keyboard-only auth journey; password-manager fill test.

## Required tests

The missing tests identified in step 1 (list them explicitly in the report).

## Completion report

Report: coverage matrix, polish list with resolutions, command results.

## Git checkpoint

`test(auth): auth flow coverage and polish`

## Status update

Update `STATUS.md` (Phase 5 complete) and the 028 row in `INDEX.md`.
