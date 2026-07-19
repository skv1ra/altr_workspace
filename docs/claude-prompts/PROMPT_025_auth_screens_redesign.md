# PROMPT 025 — Auth screens redesign

## Current project state

Public site rebuilt (024). Legacy `/auth` page (`app/auth/page.tsx`) handles
login+register modes in Ukrainian with a split glass layout; server routes
`/api/auth/{register,login}` are audited COMPLETE.

## Objective

Rebuild the login/registration experience in the new visual system, preserving
every behavioral contract (modes, `next` redirects, validation, rate-limit
handling).

## Why this task exists

Auth is the first product surface a converting visitor touches; it must match
the landing's quality while keeping the audited security behavior.

## Dependencies

011 (design system); public phase recommended complete.

## Files to inspect first

- `app/auth/page.tsx` (modes `?mode=login|register`, `next` param handling,
  error rendering `p[role="alert"]`, calls into `lib/auth.ts`)
- `lib/auth.ts`, `lib/auth/validation.ts` (client wrappers + rules — reuse, do
  not reimplement validation)
- `app/api/auth/{register,login}/route.ts` (request/response contracts)
- e2e auth tests (selectors to migrate)

## Files allowed to change

- `app/auth/page.tsx` (rebuild), `components/auth/` (create form components)
- `lib/i18n/copy.ts` (auth strings EN/UA — migrate hardcoded UA strings)
- `tests/e2e/critical-flows.spec.ts` (auth selectors), `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/auth/**`, `lib/auth/validation.ts`, `lib/auth/rate-limit.ts`,
`lib/supabase/**`, `middleware.ts`, `supabase/`.

## Implementation instructions

1. Layout: split composition — obsidian panel with a single quiet shard +
   fragment on one side, paper form panel on the other; collapses to single
   column on mobile with the form first.
2. Preserve contracts: `?mode` switching without losing typed input; `next`
   propagation to post-auth redirect; identical field validation via
   `lib/auth/validation.ts`; server error codes mapped to human copy
   (including rate-limit 429 → calm "try again shortly" state).
3. Registration keeps required consent touchpoints exactly as legacy does
   (inspect and replicate — do not drop any consent checkbox that exists).
4. Use 009 form primitives; error paragraphs keep `role="alert"`.
5. Password field: visibility toggle, `new-password`/`current-password`
   autocomplete, no strength theater beyond real validation rules.
6. Update auth e2e selectors (roles/testids), keep the same assertions.
   `yarn check` + `yarn test:e2e`.

## Visual requirements

The auth page is a product moment: cinema-quiet, one focal action, headline in
the display type ("Create your Altr" / "Return to your Altr" as EN equivalents
of the legacy copy intent).

## Security and privacy requirements

- No client-side session inference; success = server response then redirect.
- No credential values in logs, URLs, or analytics.
- Generic invalid-credentials error (no user-enumeration hints) — preserve the
  server's behavior in the UI copy.

## Edge cases

- Slow/failed network: submitting state, honest failure copy, no double submit.
- Already-authenticated visitor on `/auth` → redirect to dashboard (preserve
  legacy behavior if present; verify what legacy does first).
- Email with plus-addressing; long emails layout.

## Acceptance criteria

- [ ] Both modes rebuilt, contracts and consent touchpoints preserved.
- [ ] EN + UA strings via i18n store.
- [ ] Auth e2e green with migrated selectors.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked walkthrough of register + login + validation errors + 429 state at
desktop and 375px.

## Required tests

RTL: mode switch preserves input; error announcement; submit disabled while
pending. Updated e2e.

## Completion report

Report: contract-parity checklist, consent touchpoints preserved, selector
migrations, command results.

## Git checkpoint

`feat(auth): redesigned auth screens`

## Status update

Update `STATUS.md` and the 025 row in `INDEX.md`.
