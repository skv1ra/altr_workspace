# PROMPT 011 — Motion system

## Current project state

Full static design system exists (007–010). Legacy has `components/Reveal.tsx`
and scattered Framer Motion use.

## Objective

Codify motion: shared variants/transitions module, a rebuilt `Reveal` primitive,
ambient-drift utilities for the hero, and a global reduced-motion strategy.

## Why this task exists

"Slow and confident" motion must be systemic, not per-component improvisation;
Phase 3 (hero) consumes the drift utilities.

## Dependencies

010.

## Files to inspect first

- `components/Reveal.tsx` (legacy behavior and usage sites)
- `DESIGN_DIRECTION.md` § Motion (durations, easing, parallax caps)
- `app/styles/tokens.css` motion tokens

## Files allowed to change

- `lib/motion/index.ts` (create: variants, transitions, `useReducedMotionSafe`)
- `components/ui/Reveal.tsx` (create new; leave legacy `components/Reveal.tsx`
  untouched until its consumers migrate)
- `app/styles/motion.css` (create: drift keyframes, parallax vars)
- `app/(public)/styleguide/page.tsx`
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

Legacy `components/Reveal.tsx` and its consumers, `app/api/`, `lib/` (other than
new `lib/motion/`), `supabase/`.

## Implementation instructions

1. `lib/motion`: export canonical transition presets (`micro` 180ms, `enter`
   600ms, `drift` 24s linear-alternate) all on `--ease-altr` equivalents;
   entrance variants (fade-rise 12px, stagger 60ms); a `useReducedMotionSafe`
   hook combining Framer's `useReducedMotion` with a manual override.
2. New `Reveal`: viewport-entry fade-rise with stagger context; renders children
   statically (no hidden content) when reduced motion is on or JS fails —
   content must never be invisible without JS.
3. `motion.css`: `@keyframes altr-drift` (translate/rotate ≤ 6px/0.6deg),
   `@media (prefers-reduced-motion: reduce)` kill-switch for all ambient
   animation.
4. Styleguide: motion section demonstrating micro/enter/drift and the
   reduced-motion toggle. RTL tests; `yarn check`.

## Visual requirements

Nothing bounces, nothing loops faster than 12s ambient, entrances never move
more than 16px. Motion reads as air currents, not UI tricks.

## Security and privacy requirements

None beyond conduct rules.

## Edge cases

- SSR: Reveal must not flash-hide content before hydration (no
  `opacity: 0` in server HTML unless a CSS-only fallback reveals it).
- Nested Reveals do not compound delays unboundedly (cap stagger depth).

## Acceptance criteria

- [ ] Motion module + new Reveal + drift utilities exist and are tested.
- [ ] Content visible with JS disabled and with reduced motion.
- [ ] Styleguide demonstrates all presets.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Toggle OS reduced-motion; verify styleguide ambient motion stops entirely.
Disable JS; verify styleguide content still visible.

## Required tests

RTL: Reveal renders children when reduced-motion; variants exported with
expected durations (snapshot the config object).

## Completion report

Report: presets, reduced-motion strategy, SSR handling, tests, command results.

## Git checkpoint

`feat(design): motion system with reduced-motion`

## Status update

Update `STATUS.md` and the 011 row in `INDEX.md`. Phase 2 complete.
