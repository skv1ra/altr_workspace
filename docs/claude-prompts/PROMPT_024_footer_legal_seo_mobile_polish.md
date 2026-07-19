# PROMPT 024 — Footer, legal restyle, SEO, mobile polish

## Current project state

All landing sections + pricing built (023). WORKSPACE has no footer yet and no
legal pages — the legal CONTENT modules (`lib/legal/*-content.ts`,
`legal-config.ts`) were ported in 004; the LEGACY page shells
(`LegalDocumentPage.tsx`, `PremiumFooter.tsx`) were not ported and serve as
behavioral reference only.

## Objective

Finish the public experience: new footer, legal pages built in the new system
on top of the ported content modules (content untouched), site metadata/OG/SEO,
and a mobile polish pass over all public pages.

## Why this task exists

Public-phase closure: every public surface consistent, discoverable, and
polished before auth work begins.

## Dependencies

023.

## Files to inspect first

- LEGACY `components/PremiumFooter.tsx` (link inventory to preserve),
  `components/legal/LegalDocumentPage.tsx`, `components/LegalPage.tsx`,
  legacy legal pages (`app/{privacy,terms,cookies}/page.tsx`) — reference only
- WORKSPACE ported `lib/legal/*-content.ts` (content must not change),
  `LEGAL_SETUP.md` in LEGACY
- WORKSPACE `app/layout.tsx` metadata; `public/` (favicons/OG assets state)

## Files allowed to change

- `components/site/Footer.tsx` (create)
- `components/legal/LegalDocumentPage.tsx` (create new in WORKSPACE —
  typography via Prose primitive, rendering the ported content data untouched)
- `app/(public)/{privacy,terms,cookies}/page.tsx` (create, same URLs as LEGACY)
- `app/layout.tsx` + per-page `metadata` exports (public pages), `app/robots.ts`
  and `app/sitemap.ts` (create), OG image asset (create, from hero art)
- Public pages: responsive fixes only
- `lib/i18n/copy.ts`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`lib/legal/*-content.ts` and `lib/legal/legal-config.ts` (content/config),
`app/api/`, `supabase/`, cookie-consent logic.

## Implementation instructions

1. Footer: obsidian ground, four quiet columns (Product, Legal, Account,
   language switch + socials from env-configured URLs), consent-preferences
   trigger preserved (`CookiePreferencesButton` behavior kept).
2. Legal shell: Prose typography, reading measure, sticky in-page section list
   on desktop; recreate the LEGACY `LanguageSwitch` behavior for legal content
   (ported `lib/legal` stores drive it).
3. Metadata: unique title/description per public page; OG image (1200×630)
   composed from hero art; `robots.ts` + `sitemap.ts` (public routes only —
   exclude app/auth/api and dev-only routes).
4. Mobile pass on every public page at 320/375/768: spacing, tap targets,
   overflow — fix issues found; list them.
5. `yarn check` + `yarn test:e2e`; verify legal-consistency test still green
   (`tests/phase10-legal-consistency.test.ts`).

## Visual requirements

Footer must not become link soup — max 5 links per column, hairline rules,
generous top padding. Legal pages should read like a well-set book.

## Security and privacy requirements

- Sitemap must not expose non-public routes (`/dashboard`, `/hero-lab`, etc.).
- Legal CONTENT changes are out of scope and forbidden.

## Edge cases

- Missing env social URLs → links omitted, not dead.
- OG image weight ≤ 300 KB.

## Acceptance criteria

- [ ] Footer present on all public pages (single component).
- [ ] Legal pages live at LEGACY-identical URLs; ported content modules
      byte-identical (diff against LEGACY `a22927d`).
- [ ] Metadata/OG/robots/sitemap complete and correct.
- [ ] Mobile issues list produced and fixed.
- [ ] `yarn check` and `yarn test:e2e` pass.

## Verification commands

- `yarn check`
- `yarn test:e2e`

## Manual verification

Share-preview check of OG rendering; read `/privacy` on a phone-sized viewport
end to end.

## Required tests

RTL: Footer link inventory; legal shell renders content headings.

## Completion report

Report: link inventory diff, mobile fixes list, metadata table, command results.

## Git checkpoint

`feat(site): footer, legal restyle and SEO`

## Status update

Update `STATUS.md` (Phase 4 complete) and the 024 row in `INDEX.md`.
