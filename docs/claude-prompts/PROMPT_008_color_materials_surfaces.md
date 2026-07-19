# PROMPT 008 — Color, materials, surfaces

## Current project state

Typography primitives and styleguide exist (007).

## Objective

Build the surface/material system: page grounds, obsidian (dark) surfaces, fog
gradients, hairline rules, and shadow recipes as reusable primitives.

## Why this task exists

The reference's premium feel comes from believable materials, not components.
Standardizing them prevents "cheap glassmorphism" drift later.

## Dependencies

007.

## Files to inspect first

- `DESIGN_DIRECTION.md` § Materials and surfaces (including the Forbidden list)
- `app/styles/tokens.css`
- Legacy surfaces: `app/globals.css`, `components/HeroGlassScene.module.css`
  (what to avoid/reuse)

## Files allowed to change

- `components/ui/Surface.tsx` (create), `app/styles/materials.css` (create)
- `app/(public)/styleguide/page.tsx` (add materials section)
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Existing pages, `app/api/`, `lib/`, `supabase/`, `middleware.ts`.

## Implementation instructions

1. Implement surface variants as a typed `<Surface>` primitive + material CSS:
   `page` (paper white), `inverse` (obsidian with subtle facet gradient and 1px
   edge highlight), `fog` (layered gradient overlay, pointer-events-none),
   `hairline` utilities (top/bottom/left dividers at `--altr-silver` 60%).
2. Shadow recipes exactly per DESIGN_DIRECTION (large-radius, low-opacity); no
   Tailwind default shadows anywhere in new code.
3. Obsidian surface must include the facet treatment (very subtle linear
   gradients at 2–4% white) so it never reads as flat black.
4. Add all variants to the styleguide with light/dark context examples.
5. `yarn check`.

## Visual requirements

Compare against the shard renders in `public/hero-shards/` — the inverse surface
should feel like the same material family. Forbidden list enforced: no frosted
white-border cards, no neon, no heavy gradients.

## Security and privacy requirements

None beyond conduct rules.

## Edge cases

- Fog overlays must not intercept clicks or harm text contrast (test 4.5:1 for
  body text over fog).
- Nested inverse surfaces (dialog on dark dashboard) need one-step elevation.

## Acceptance criteria

- [ ] Surface primitive with page/inverse/fog/hairline variants, tested.
- [ ] Contrast: body text ≥ 4.5:1 on every surface variant.
- [ ] Styleguide shows all materials.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

View styleguide beside `public/hero-shards/shard-main.png` — material family
must feel continuous.

## Required tests

RTL render tests for Surface variants; a unit test asserting the contrast pairs
used in tokens (encode expected hex pairs).

## Completion report

Report: variants built, contrast measurements, command results.

## Git checkpoint

`feat(design): material and surface system`

## Status update

Update `STATUS.md` and the 008 row in `INDEX.md`.
