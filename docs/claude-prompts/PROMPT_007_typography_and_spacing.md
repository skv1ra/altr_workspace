# PROMPT 007 — Typography and spacing

## Current project state

Shell and boundaries exist (006); tokens defined (005). No shared typographic
components yet.

## Objective

Build the typographic system as reusable primitives: display/heading/body/label
components (or utility classes), prose styles, and the spacing rhythm rules.

## Why this task exists

Premium editorial typography is the backbone of the reference's look; every later
screen consumes these primitives.

## Dependencies

006.

## Files to inspect first

- `docs/claude-prompts/DESIGN_DIRECTION.md` § Typography
- `app/styles/tokens.css`, `tailwind.config.ts`
- Legacy headline usage in `app/page.tsx`, `app/pricing/page.tsx`

## Files allowed to change

- `components/ui/Text.tsx` (create — or equivalent primitives under `components/ui/`)
- `app/styles/typography.css` (create; imported after tokens)
- `tailwind.config.ts` (fontSize/lineHeight/letterSpacing mappings only)
- `tests/components/` (new component tests)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

- Existing pages (they adopt primitives later, per screen prompt)
- `app/api/`, `lib/`, `supabase/`, `middleware.ts`

## Implementation instructions

1. Implement the fluid type scale from DESIGN_DIRECTION (clamp-based display
   through label sizes; tight display leading 1.02–1.08; body 1.6/68ch measure;
   label tracking +6%).
2. Create typed primitives (e.g. `<Display>`, `<Heading level>`, `<Body>`,
   `<Label>`, `<Prose>`) rendering semantic elements with `as` override;
   no inline styles; classes composed from tokens.
3. Define vertical rhythm helpers (section spacing: `--space-16/24` on desktop,
   reduced on mobile) documented in a comment header in typography.css.
4. Add an internal-only preview route `app/(public)/styleguide/page.tsx` gated to
   non-production (`notFound()` when `process.env.NODE_ENV === "production"`),
   showing the full scale — this page persists for later design-system prompts.
5. RTL tests: primitives render correct tag/class; `yarn check`.

## Visual requirements

Display sizes must feel editorial and expensive: light weight, tight leading,
generous whitespace. Latin + Cyrillic render correctly (UA copy).

## Security and privacy requirements

Styleguide route must 404 in production builds.

## Edge cases

- Very long unbroken strings (emails) in body text → `overflow-wrap`.
- Nested Prose (legal pages) must not compound margins.

## Acceptance criteria

- [ ] Primitives exist, typed, tested.
- [ ] Styleguide page shows the full scale; 404s in production.
- [ ] Cyrillic renders in the chosen font.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Open `/styleguide` in dev; compare display headline proportions against the
reference image's headline block.

## Required tests

RTL tests for each primitive (tag, class, `as` override).

## Completion report

Report: primitives created, scale values, tests added, command results.

## Git checkpoint

`feat(design): typography and spacing system`

## Status update

Update `STATUS.md` and the 007 row in `INDEX.md`.
