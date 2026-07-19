# PROMPT 014 — Hero scene composition

## Current project state

Production assets ready (013); prototype scene in `components/hero/` +
`/hero-lab`.

## Objective

Compose the final static hero scene: layer arrangement, fog atmosphere, light
direction, shadows, and the headline/CTA block — matching the reference's
composition without copying it pixel-for-pixel.

## Why this task exists

Composition is where "expensive" is won: scale relationships, negative space,
and focal hierarchy per the reference.

## Dependencies

013.

## Files to inspect first

- `references/altr-hero-reference.png` (composition: headline left, shard field
  right/upper, fog density map)
- New assets in `public/hero-shards/`
- `components/hero/`, design-system primitives (Display, Button, Surface fog)

## Files allowed to change

- `components/hero/` (scene components; finalize structure:
  `HeroScene.tsx`, `HeroLayers.tsx`, `HeroCopy.tsx`)
- `app/(public)/hero-lab/page.tsx`
- `public/hero-shards/` (delete superseded old assets once consumers swapped)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/page.tsx` (integration happens in Prompt 020), `app/api/`, `lib/`,
`supabase/`, tests.

## Implementation instructions

1. Build the full-bleed scene (min-height ~92vh, reserved via aspect-ratio/vh so
   CLS = 0): background fog wash → far shards (soft) → mid shards → headline
   block → near shards (pre-blurred, partially overlapping viewport edges) →
   particle canvas → top fog veil.
2. Headline block uses fixed copy: "Your past learns to remain." /
   "A digital continuation of you, shaped by memory, style, and time." /
   CTA "Create your Altr" (Button primary) + secondary quiet link "How it works".
3. Light discipline: single implied key light upper-left; shard highlights and
   soft shadows must agree with it; fog denser toward top-right.
4. Text contrast: headline `--altr-obsidian` on light fog, measured ≥ 7:1;
   shards never intersect the headline's clear-space box on any breakpoint.
5. Iterate in `/hero-lab` until the side-by-side with the reference holds up.
   `yarn check`.

## Visual requirements

Reference-grade: controlled composition, generous negative space, believable
DOF (foreground blur heavier than background), no element that looks placed by
a grid template. This is original work inspired by — not a copy of — the
reference.

## Security and privacy requirements

None new; assets self-hosted.

## Edge cases

- Ultra-wide (>1920px): shard field scales/crops gracefully, headline max-width
  holds.
- Short viewports (<700px height): CTA remains above the fold.

## Acceptance criteria

- [ ] Final composition in `/hero-lab` with fixed copy and CTA.
- [ ] Headline contrast ≥ 7:1; clear-space respected at all breakpoints.
- [ ] Zero CLS (layout reserved before images load).
- [ ] Old superseded assets removed; no unused files in `public/hero-shards/`.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Side-by-side screenshot vs reference at 1440px and 1920px; user approves
composition before Prompt 015.

## Required tests

RTL: HeroCopy renders exact fixed copy strings (guards against copy drift).

## Completion report

Report: layer structure, contrast measurements, asset cleanup, approval status.

## Git checkpoint

`feat(hero): cinematic scene composition`

## Status update

Update `STATUS.md` and the 014 row in `INDEX.md`.
