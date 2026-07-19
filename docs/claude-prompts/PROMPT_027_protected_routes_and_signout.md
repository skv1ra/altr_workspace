# PROMPT 027 — Protected routes and sign-out

## Current project state

Auth screens rebuilt (025–026). Middleware session refresh and `requireUser`
guards are legacy-audited COMPLETE; sign-out exists via `/api/auth/logout`.

## Objective

Verify and harden the protected-route experience in the new UI: consistent
redirect behavior with `next` preservation, session-expiry UX, and a designed
sign-out flow.

## Why this task exists

Route protection is server-side already; this prompt makes the user-facing
half (redirects, expiry, sign-out) coherent in the new system.

## Dependencies

026.

## Files to inspect first

- `middleware.ts`, `lib/supabase/middleware.ts` (what triggers redirects today)
- `lib/auth/server.ts`, `lib/supabase/server.ts` (`requireUser` semantics)
- e2e "protected route redirects anonymous users" test (contract:
  `/auth?mode=login&next=%2Fdashboard`)
- Legacy sign-out usage (dashboard button, `lib/auth.ts` wrapper)

## Files allowed to change

- `components/auth/SignOutButton.tsx` (create)
- Client-side 401 handling helper in `lib/auth.ts` (extend without changing
  existing exports' behavior)
- `tests/components/`, e2e
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`middleware.ts`, `lib/supabase/**`, `app/api/auth/**`, `supabase/`.

## Implementation instructions

1. Enumerate protected pages (dashboard, memory, assistants, imports, billing,
   privacy surfaces) and verify each redirects anonymously to
   `/auth?mode=login&next=<path>` — fix any page that leaks a flash of
   protected UI (loading boundary from 006 should cover; verify).
2. Session expiry mid-use: standardize API-401 handling — a single helper that
   routes to `/auth?mode=login&next=<current>` with a toast ("Session expired,
   sign in again"); adopt in new components only (legacy screens adopt as they
   are rebuilt).
3. SignOutButton: POST `/api/auth/logout`, disabled/pending state, redirect
   home, toast confirmation; keyboard accessible.
4. `yarn check` + `yarn test:e2e` (protected-route and sign-out tests must pass).

## Visual requirements

Expiry and sign-out moments stay calm: no alarming red, no modal interruption
unless data loss is at stake.

## Security and privacy requirements

- No protected content in server HTML for anonymous requests (verify with curl
  against a running dev server).
- Sign-out clears client caches of user data held in memory by new components.

## Edge cases

- `next` pointing to a non-existent or external URL → same-origin check before
  redirect (add to the helper; the server side is authoritative regardless).
- Sign-out with pending in-flight requests.
- Multiple tabs: sign-out in one tab → other tab's next API call 401s into the
  standard flow.

## Acceptance criteria

- [ ] Protected-page inventory verified with redirect proof per page.
- [ ] 401 helper implemented and used by new auth-aware components.
- [ ] SignOutButton shipped and wired where the legacy button existed.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

curl each protected route anonymously; expire a mocked session mid-flow and
observe the UX.

## Required tests

e2e: protected redirect (existing, selectors updated if needed) + sign-out
flow. RTL: SignOutButton pending/disabled behavior.

## Completion report

Report: protected-page inventory table, helper adoption list, command results.

## Git checkpoint

`feat(auth): protected routing and sign-out UX`

## Status update

Update `STATUS.md` and the 027 row in `INDEX.md`.
