# PROMPT 031 — Onboarding and quota display

## Current project state

Shell + settings live (029–030). The audit found NO legacy onboarding (only a
copy reference); quotas exist server-side (`lib/billing/limits.ts`) with
partial display on legacy import page.

## Objective

Build a thin first-run onboarding (new functionality, honestly scoped) and the
reusable quota/entitlement display components used across the app.

## Why this task exists

Auth copy promises "a short onboarding"; new accounts currently land on an
empty dashboard with no guidance. Quota surfaces recur in imports, memory, and
Twin screens — build once here.

## Dependencies

030.

## Files to inspect first

- `lib/billing/{limits,entitlements,types}.ts`, `/api/billing/me` payload
- `altr_profiles` / `altr_user_preferences` migrations — find a suitable
  existing column for onboarding completion; if none exists, a NEW additive
  migration is required (ADR-002 rules)
- Dashboard empty states from 029

## Files allowed to change

- `app/(app)/onboarding/page.tsx` (create), `components/app/onboarding/`
- `components/app/QuotaMeter.tsx`, `components/app/PlanBadge.tsx` (create)
- IF needed: one new migration `supabase/migrations/<timestamp>_onboarding_state.sql`
  (additive column with default, RLS-covered) + regenerate `supabase/schema.sql`
- `app/api/me/route.ts` and `lib/profileServer.ts` ONLY IF the onboarding flag
  needs exposure (minimal additive change, no contract breakage — existing
  fields untouched)
- `lib/i18n/copy.ts`, `tests/`, `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Existing migrations, `lib/billing/**` logic, `app/api/billing/**`, webhook code.

## Implementation instructions

1. Onboarding: max 3 steps, skippable at every step, shown once —
   (a) name your Altr (writes real profile fields via existing wrapper),
   (b) choose tone, (c) point to the first action (Import conversations).
   No fake progress, no data collection beyond existing profile fields.
2. Completion/skip persists server-side (flag from step above); dashboard
   routes new users to onboarding only until flagged.
3. QuotaMeter: hairline linear meter + "used / limit" numerals from real
   endpoint data; states: normal, near-limit (≥80%), reached (with upgrade
   link to `/pricing`); never blocks UI by itself.
4. PlanBadge: quiet label (Free/Personal/Work) from server entitlement.
5. Wire QuotaMeter into the dashboard rows (029). `yarn check` + `yarn test:e2e`.

## Visual requirements

Onboarding is cinematic-quiet: one question per viewport, display type, obsidian
ground, a single shard drifting — not a wizard with progress dots.

## Security and privacy requirements

- Onboarding flag additive with safe default (false) and RLS scoping.
- Skipping must be as easy as completing (no dark patterns).

## Edge cases

- Migration applied but old frontend deployed (rollback window): additive
  column must be ignorable — verify no legacy code breaks.
- Quota endpoint failing → meters show unknown state, not zeros.
- User re-visits `/onboarding` after completion → redirect to dashboard.

## Acceptance criteria

- [ ] Onboarding shippable in ≤ 3 steps, skippable, persisted server-side.
- [ ] Migration (if created) additive, RLS-covered, schema.sql regenerated.
- [ ] QuotaMeter/PlanBadge live on dashboard with real data.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

New-account mocked flow: onboarding → dashboard; re-entry redirect; quota
states at 0%, 85%, 100%.

## Required tests

RTL: QuotaMeter three states; onboarding skip persists (mocked). e2e: new-user
routing.

## Completion report

Report: migration decision (existing column vs new), API changes if any,
command results.

## Git checkpoint

`feat(app): onboarding and quota display`

## Status update

Update `STATUS.md` (Phase 6 complete) and the 031 row in `INDEX.md`.
