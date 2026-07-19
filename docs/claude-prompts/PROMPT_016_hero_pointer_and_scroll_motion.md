# PROMPT 016 — Hero pointer and scroll motion

## Current project state

Scene with fragments complete and static-approved (015).

## Objective

Add the interactive motion layer: smoothed pointer parallax, ambient drift, and
scroll choreography (shards separate, fog thins) within DESIGN_DIRECTION caps.

## Why this task exists

Motion sells depth in the hybrid approach (ADR-007 mitigation) — but restraint
is the brief; this prompt isolates motion so it can be tuned and reviewed alone.

## Dependencies

015.

## Files to inspect first

- `lib/motion/` presets (011), `app/styles/motion.css`
- `components/hero/` layer structure
- DESIGN_DIRECTION § Motion (±10px/±4px parallax caps, lerp smoothing)

## Files allowed to change

- `components/hero/` (motion hooks/components, e.g. `useHeroPointer.ts`,
  `useHeroScroll.ts`)
- `app/(public)/hero-lab/page.tsx`
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/page.tsx`, `app/api/`, `lib/` (outside `lib/motion` consumers), `supabase/`.

## Implementation instructions

1. Pointer parallax: normalized pointer position → per-layer offsets
   (foreground max ±10px, background ±4px, fragments follow their layer),
   lerp-smoothed (~0.08 factor) in a single rAF loop; passive listeners;
   loop suspends when hero off-screen (IntersectionObserver) or tab hidden.
2. Ambient drift: apply `altr-drift` variants per layer with phase offsets so
   no two shards move in sync; ≤ 6px translation, ≤ 0.6deg rotation.
3. Scroll choreography: over the first ~80vh of scroll, shards separate a few
   percent along their depth axis, fog opacity eases down, headline parallaxes
   ≤ 8px. Use transform/opacity only (compositor-friendly), driven by scroll
   position with rAF throttling — text must remain readable at every scroll
   position.
4. All motion routes through `useReducedMotionSafe` — reduced motion renders
   the 015 static scene exactly.
5. Measure FPS again during combined pointer+scroll; must hold ≥ 55 FPS.
   `yarn check`.

## Visual requirements

Motion must feel like air and mass: slow, damped, never snappy. If a reviewer
notices the parallax mechanism itself, it is too strong.

## Security and privacy requirements

None new.

## Edge cases

- Touch devices: no pointer parallax; scroll choreography still applies.
- Rapid pointer exit/enter: lerp prevents jumps.
- Browser zoom ≠ broken offsets (use relative units in transforms).

## Acceptance criteria

- [ ] Parallax within caps, lerp-smoothed, suspended off-screen.
- [ ] Scroll choreography transform/opacity-only; text readable throughout.
- [ ] Reduced motion = fully static scene.
- [ ] ≥ 55 FPS sustained (recorded measurement).
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

DevTools performance recording during 10s of pointer+scroll; verify no layout
thrash (no purple layout bars in the hero loop).

## Required tests

RTL: hooks return zero offsets under reduced motion (mock matchMedia).

## Completion report

Report: motion parameters chosen, FPS measurements, reduced-motion proof.

## Git checkpoint

`feat(hero): pointer and scroll motion`

## Status update

Update `STATUS.md` and the 016 row in `INDEX.md`.
