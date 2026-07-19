# PROMPT 029 — Dashboard shell

## Current project state

Auth complete (028). WORKSPACE has no authenticated screens yet. In LEGACY
(reference), the dashboard (`app/dashboard/page.tsx`) is a Ukrainian-language
server-profile page inside `AppShell`; other app pages (memory, assistants,
imports, billing) render standalone — that structure informs the new shell's
responsibilities, not its look.

## Objective

Build the authenticated application shell: obsidian layout, primary navigation,
user identity area, and the dashboard home surface fed by `/api/me`.

## Why this task exists

Every Phase 6–11 screen lives inside this shell; the dashboard must set the
"restrained surfaces, no card grid" tone for the whole app.

## Dependencies

027 (protected routing verified).

## Files to inspect first

- `components/AppShell.tsx` (legacy shell responsibilities)
- `app/dashboard/page.tsx`, `lib/profileServer.ts`, `app/api/me/route.ts`
  (profile payload shape)
- App page inventory: memory, assistants, import-conversations, billing,
  privacy surfaces (nav destinations)
- e2e dashboard test (mocked `/api/me` contract)

## Files allowed to change

- `components/app/{AppShell,AppNav,UserMenu}.tsx` (create — the LEGACY
  `AppShell.tsx` was never ported; it stays reference-only)
- `app/(app)/dashboard/page.tsx` (create at URL `/dashboard`)
- `app/(app)/` layout for authenticated routes
- `lib/i18n/copy.ts`
- `tests/components/`, e2e dashboard selectors
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/profileServer.ts`, `lib/supabase/**`, `supabase/`, other app
pages (they migrate into the shell in their own prompts).

## Implementation instructions

1. Shell: obsidian ground; slim left rail (desktop) / bottom-sheet nav (mobile)
   with: Dashboard, Memory, Imports, Twin, Billing, Privacy, Settings; hairline
   separation; active state = quiet silver edge, not filled pills.
2. User area: name/email from server profile, plan badge (from `/api/billing/me`
   pattern — display only), SignOutButton from 027, language switch.
3. Dashboard home: greeting (server profile name), three editorial status rows
   (not cards): Memory (count/quota), Imports (last import state), Twin (drafts
   used this month) — each linking to its section; data from existing endpoints
   only. Loading skeletons via 006 patterns; designed empty states for new
   accounts.
4. Only the dashboard ships this prompt; nav entries for screens that do not
   exist yet are omitted entirely (ADR-013 — no dead links), added by their
   own prompts.
5. Port the LEGACY dashboard e2e block and adapt it (greeting heading asserted
   via testid/role with EN + UA tolerant assertion).
   `yarn check` + `yarn test:e2e`.

## Visual requirements

The dashboard must NOT be a grid of rounded cards. Editorial rows, big quiet
numerals, hairlines, one focal CTA ("Import conversations" for empty accounts).
Continuity with the landing's obsidian sections.

## Security and privacy requirements

- All displayed state from server endpoints; no entitlement inference client-side.
- No PII in client logs.

## Edge cases

- Brand-new account (all zeros) → designed empty state with one clear action.
- `/api/billing/me` slow/failing → rows render with graceful unknowns, no spinners forever.
- Long names/emails in the user area.

## Acceptance criteria

- [ ] Shell + nav + user area implemented, keyboard navigable.
- [ ] Dashboard home rebuilt with real server data and designed empty states.
- [ ] e2e dashboard + sign-out tests pass with migrated selectors.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked walkthrough: new account and populated account, desktop + 375px; keyboard
nav across the rail.

## Required tests

RTL: AppNav active state, UserMenu render, dashboard empty state. Updated e2e.

## Completion report

Report: nav inventory, adopted/legacy screen ledger, command results.

## Git checkpoint

`feat(app): premium dashboard shell`

## Status update

Update `STATUS.md` (screen ledger: dashboard rebuilt) and the 029 row in `INDEX.md`.
