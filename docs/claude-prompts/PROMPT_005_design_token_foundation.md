# PROMPT 005 — Design token foundation

## Current project state

Scaffolded WORKSPACE with the ported backend and green `yarn check` (Prompt
004). Only a minimal unstyled app shell exists; no legacy styles were ported.

## Objective

Create the single-source design token layer (`app/styles/tokens.css`) and wire it
into Tailwind and the font pipeline, without restyling any existing screen yet.

## Why this task exists

ADR-009: every later visual prompt consumes these tokens. Building screens before
tokens guarantees drift.

## Dependencies

004.

## Files to inspect first

- `docs/claude-prompts/DESIGN_DIRECTION.md` (palette, type, motion values)
- WORKSPACE: `tailwind.config.ts` (ported), `app/layout.tsx` (minimal)
- WORKSPACE `middleware.ts` (CSP `font-src 'self' data:` — fonts self-hosted)
- LEGACY `app/globals.css` and `app/accessibility.css` (conventions worth
  keeping in mind — read-only reference, do not copy wholesale)

## Files allowed to change

- `app/styles/tokens.css` (create), `app/styles/` (create directory)
- `tailwind.config.ts` (map tokens via `var(...)`)
- `app/layout.tsx` (import tokens.css; add `next/font` setup)
- `app/globals.css` (create minimal global stylesheet importing tokens)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

- All pages/components (visuals unchanged this prompt), `middleware.ts`,
  `app/api/`, `lib/`, `supabase/`, tests

## Implementation instructions

1. Define CSS custom properties in `tokens.css` per DESIGN_DIRECTION: the six
   grayscale colors, semantic aliases (`--surface-page`, `--surface-inverse`,
   `--text-primary`, `--text-muted`, `--edge-hairline`), fluid type scale
   (`--text-display`, `--text-h1..h4`, `--text-body`, `--text-label` via clamp),
   spacing scale (4px base: `--space-1..--space-24`), radii, shadow recipes,
   motion durations (`--motion-fast: 180ms`, `--motion-slow: 600ms`,
   `--motion-drift: 24s`) and the signature easing
   `--ease-altr: cubic-bezier(0.22, 1, 0.36, 1)`.
2. Extend `tailwind.config.ts` theme with colors/spacing/fontSize referencing the
   custom properties (`colors: { obsidian: "var(--altr-obsidian)" … }`).
3. Set up the chosen variable font with `next/font` (decide Inter vs Geist here;
   record the decision in ARCHITECTURE_DECISIONS ADR-009 addendum), exposed as a
   CSS variable and applied on `<html>`.
4. Verify the minimal `/` page renders with the font applied and tokens present
   on `:root` (there are no other screens yet).
5. Run `yarn check`.

## Visual requirements

Tokens must reproduce DESIGN_DIRECTION values exactly; no extra colors, no
accent hues, no neon.

## Security and privacy requirements

- Fonts self-hosted only (CSP unchanged). No external stylesheet/CDN.

## Edge cases

- Tailwind opacity modifiers need RGB channels — provide `--altr-*-rgb` triplet
  variables where alpha composition is required.
- next/font subsetting: include Latin + Cyrillic (UA copy exists).

## Acceptance criteria

- [ ] `tokens.css` contains color/type/spacing/radius/shadow/motion tokens.
- [ ] Tailwind utilities resolve to token values.
- [ ] Font self-hosted, applied globally, Cyrillic subset included.
- [ ] Minimal page renders with tokens and font active.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Run dev server; inspect computed styles on `/` — font applied, tokens present on
`:root`; confirm no layout shift vs before.

## Required tests

None new (foundation); existing suite green.

## Completion report

Report: token groups created, font decision, Tailwind mappings, command results.

## Git checkpoint

`feat(design): add Altr design token foundation`

## Status update

Update `STATUS.md` (font decision recorded) and the 005 row in `INDEX.md`.
