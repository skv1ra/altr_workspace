# PROMPT 019 — Public header and navigation

## Current project state

Design system complete (011); hero verified (018) or in progress — this prompt
needs only the design system. Legacy nav: `components/Navigation.tsx`,
`components/LanguageSwitcher.tsx`.

## Objective

Build the premium public header: shard-glyph wordmark, `Product · How it works ·
Pricing · Log in` navigation, language switch, mobile menu — matching the
reference's restraint.

## Why this task exists

The reference shows exactly this header; it frames every public page and must
never be blocked by hero loading.

## Dependencies

011.

## Files to inspect first

- `components/Navigation.tsx` (routes/links to preserve incl. auth-state links)
- `components/LanguageSwitcher.tsx`, `lib/i18n/*` (ADR-006)
- Reference image header region

## Files allowed to change

- `components/site/Header.tsx` (create), `components/site/Logo.tsx` (create),
  `components/site/MobileMenu.tsx` (create)
- `lib/i18n/copy.ts` (add nav strings EN/UA)
- `app/(public)/styleguide/page.tsx` (header preview)
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`components/Navigation.tsx` (legacy stays until 020 swaps it), `app/api/`,
`lib/` (other than i18n copy), `supabase/`.

## Implementation instructions

1. Logo: small dark shard glyph (original SVG in the asset family of the hero
   shards) + "Altr" wordmark; links home.
2. Nav links: Product (`/#product`), How it works (`/#how-it-works`), Pricing
   (`/pricing`), Log in (`/auth?mode=login`) — plus "Create your Altr" as a
   compact primary button on desktop. Anchor targets are created in 020–022;
   until then they resolve to `/` sections that exist — verify no dead link at
   integration time (020 re-checks).
3. Auth-aware: when a session exists (reuse the pattern legacy Navigation uses
   via `/api/me`), swap Log in → Dashboard. Server state remains authoritative.
4. Behavior: transparent over the hero, gaining a fog-blur backdrop + hairline
   after 24px scroll (compositor-friendly); mobile menu = full-screen quiet
   overlay using Dialog primitives, body scroll locked.
5. Language switch integrated per ADR-006. RTL tests; `yarn check`.

## Visual requirements

Small dark text on light, generous letter-spacing on labels, no boxes around
links; scrolled state must remain understated (no heavy card header).

## Security and privacy requirements

- Auth display state read from server endpoint, never inferred from
  localStorage.

## Edge cases

- Keyboard: menu button reachable, Escape closes, focus returns.
- Long UA strings in nav must not wrap the bar.
- No session endpoint response (offline) → render logged-out state gracefully.

## Acceptance criteria

- [ ] Header + mobile menu implemented, auth-aware, bilingual.
- [ ] Scroll transition subtle and jank-free.
- [ ] Keyboard/screen-reader operable.
- [ ] `yarn check` passes; legacy nav untouched and still in use.

## Verification commands

- `yarn check`

## Manual verification

Styleguide preview: resize through breakpoints, toggle language, test with
mocked logged-in state.

## Required tests

RTL: renders links, auth-state swap, mobile menu open/close focus behavior.

## Completion report

Report: components, i18n strings added, a11y notes, command results.

## Git checkpoint

`feat(site): premium public header`

## Status update

Update `STATUS.md` and the 019 row in `INDEX.md`.
