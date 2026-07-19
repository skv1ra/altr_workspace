# PROMPT 030 — Profile and settings

## Current project state

Dashboard shell live (029). Legacy profile editing happens inline on the old
dashboard via `updateCurrentProfile` (`lib/auth.ts`); `/legacy-migration` page
exists for localStorage import; no dedicated settings page.

## Objective

Create the settings area inside the new shell: profile identity (name, altr
name, bio, tone), preferences, and a re-styled home for the legacy-migration
utility.

## Why this task exists

Parity: profile editing is COMPLETE in legacy and must survive; the rebuild
gives it a proper home and structure for later settings (privacy lives in 045).

## Dependencies

029.

## Files to inspect first

- `lib/auth.ts` (`updateCurrentProfile` contract), `app/api/me/route.ts`
- `app/legacy-migration/page.tsx` (behavior to preserve as-is)
- `altr_profiles` / `altr_user_preferences` columns in migrations (what is
  actually storable — do not invent fields)

## Files allowed to change

- `app/(app)/settings/page.tsx` (create), `components/app/settings/` (create)
- `app/legacy-migration/page.tsx` (create in WORKSPACE by porting the LEGACY
  page's logic verbatim — same URL, same behavior — then applying the new
  shell visuals; its API route was ported in 004)
- `lib/i18n/copy.ts`
- `tests/components/`, e2e additions
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/api/**`, `lib/auth.ts` logic (may add typed helpers, not change existing),
`lib/profileServer.ts`, `supabase/`.

## Implementation instructions

1. Settings page structure: sections as quiet anchored groups (Identity,
   Preferences, Language, Danger zone pointer → links to the privacy center
   coming in 045 — until 045 lands, link to the existing legacy privacy pages
   so nothing is dead).
2. Identity form: fields matching real profile columns; optimistic-free save
   (server confirm then toast); dirty-state guard (Dialog from 010) on
   navigation with unsaved changes.
3. Tone selector uses the same enum the Twin config uses (verify allowed values
   from code, e.g. balanced/warm/direct/formal).
4. Legacy-migration page: port its logic verbatim from LEGACY, wrap in the new
   shell visuals; behavior byte-identical (diff the logic against `a22927d`).
5. Nav "Settings" entry (029) now resolves here. `yarn check` + `yarn test:e2e`.

## Visual requirements

Forms in the 009 system on obsidian; section headers editorial; danger-zone
pointer visually distinct but not alarmist.

## Security and privacy requirements

- Only fields that exist server-side; server validation remains authoritative;
  no new PII fields introduced.

## Edge cases

- Concurrent edit in two tabs (last-write-wins is legacy behavior — keep, but
  refresh state after save).
- Empty profile (new user) placeholder guidance.
- Save failure → field-level error mapping, form state preserved.

## Acceptance criteria

- [ ] Settings page live in shell with working identity/preferences save.
- [ ] Dirty-state guard works; no dead links (045 targets bridged).
- [ ] Legacy-migration ported with logic identical to LEGACY (diff proof),
      new visuals only.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Mocked save round-trip; unsaved-changes guard; 375px layout.

## Required tests

RTL: form renders from profile payload, save calls wrapper with changed fields
only, dirty guard triggers.

## Completion report

Report: fields implemented vs schema, bridged links, command results.

## Git checkpoint

`feat(app): profile and settings surfaces`

## Status update

Update `STATUS.md` and the 030 row in `INDEX.md`.
