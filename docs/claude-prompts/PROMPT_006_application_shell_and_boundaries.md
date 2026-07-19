# PROMPT 006 — Application shell and boundaries

## Current project state

Tokens and fonts exist (005). WORKSPACE has only the minimal `app/layout.tsx`
and `app/page.tsx` from 004 plus ported API routes — no route groups, no
custom error/loading boundaries yet.

## Objective

Establish the new application shell: route groups `(public)` and `(app)`, root
layout metadata, global error boundary, not-found page, and route-level loading
boundaries — all styled with tokens.

## Why this task exists

Every rebuilt screen needs a home. Error/loading/not-found states are part of the
premium experience ("custom loading, empty and error states" requirement).

## Dependencies

005.

## Files to inspect first

- WORKSPACE: `app/layout.tsx`, `app/page.tsx`, ported `middleware.ts`
  (session refresh applies to all routes), ported `lib/i18n/lang-store.ts`
- LEGACY (reference): `app/layout.tsx`, `components/LocaleHtmlSync.tsx`,
  `components/AppShell.tsx` — behaviors the new shell must account for
  (html lang sync, metadata patterns)

## Files allowed to change

- `app/layout.tsx`, `app/error.tsx` (create), `app/not-found.tsx` (create),
  `app/global-error.tsx` (create)
- Route group directories `app/(public)/` and `app/(app)/` (create fresh —
  future screens land inside them; the minimal `app/page.tsx` moves into
  `(public)` keeping URL `/`)
- `components/LocaleHtmlSync.tsx` (port from LEGACY — small client component
  the root layout needs)
- `app/(app)/loading.tsx`, `app/(public)/loading.tsx` (create)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

- `app/api/**` (route handlers keep exact paths), `middleware.ts`, `lib/`,
  `supabase/`, `workers/`, tests other than path updates forced by moves

## Implementation instructions

1. Create the `(public)` and `(app)` groups; route groups must not change any
   URL — verify with `yarn build` route output (API routes ported in 004 must
   keep their exact paths).
2. Root layout: token stylesheet, font variable, `<html lang>` synced via the
   ported `LocaleHtmlSync` behavior, metadata (title template
   `"%s — Altr"`, description from hero support copy), viewport, theme-color.
3. `error.tsx` / `global-error.tsx`: calm editorial error state (headline, quiet
   explanation, retry button using existing router.refresh) — no stack traces.
4. `not-found.tsx`: same system; link back home.
5. `loading.tsx` per group: minimal fog-toned skeleton (no spinners-only).
6. The minimal homepage keeps rendering its real copy inside `(public)`
   (ADR-013: nothing half-wired ships).
7. `yarn check` + `yarn test:e2e` (the 004 smoke spec; URLs unchanged).

## Visual requirements

Boundary screens follow DESIGN_DIRECTION (palette, type, spacing); they are the
first fully new surfaces — they must already look art-directed, not default.

## Security and privacy requirements

- Error boundaries never render error.message from server errors verbatim if it
  could contain internals; show a generic message and log via existing patterns.

## Edge cases

- Route-group move breaking a relative import → fix imports, never duplicate files.
- `global-error.tsx` renders without root layout — it must inline critical tokens.

## Acceptance criteria

- [ ] Route groups exist; every public URL identical (verified via build output).
- [ ] Custom error, global-error, not-found, and loading boundaries render.
- [ ] Root metadata and lang behavior preserved.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Visit a bogus URL (404 page), throw a test error locally in a scratch page and
confirm the boundary, then remove the scratch page.

## Required tests

Update/add a unit test asserting the not-found and error components render their
headline (RTL).

## Completion report

Report: files created/moved, URL verification method, command results, risks.

## Git checkpoint

`feat(app): new application shell with boundaries`

## Status update

Update `STATUS.md` and the 006 row in `INDEX.md`.
