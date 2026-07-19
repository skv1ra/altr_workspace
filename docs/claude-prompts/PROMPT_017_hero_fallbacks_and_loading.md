# PROMPT 017 — Hero fallbacks and loading

## Current project state

Fully interactive hero in `/hero-lab` (016).

## Objective

Ship the degradation tiers: mobile composition, reduced-motion (verified),
no-JS/legacy-browser fallback, and a zero-CLS progressive loading strategy.

## Why this task exists

ADR-008; the performance budget requires the hero to never block navigation,
auth, or the CTA, on any device.

## Dependencies

016.

## Files to inspect first

- `components/hero/`, asset tiers from 013 (mobile ≤ 350 KB set)
- ADR-008 (tier definitions), `next.config.js` (image handling)

## Files allowed to change

- `components/hero/` (tier logic, `<picture>`/`srcset` wiring, loading states)
- `app/(public)/hero-lab/page.tsx` (tier preview switches)
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/page.tsx`, `app/api/`, `lib/`, `supabase/`.

## Implementation instructions

1. Mobile tier (≤ 768px): reduce to 3–4 shards, mobile asset set, no pointer
   parallax, scroll drift only; recompose so headline/CTA own the frame
   (portrait composition, shards above/behind text with guaranteed contrast).
2. Loading strategy: reserve full layout immediately (no CLS); headline, nav,
   and CTA render from server HTML instantly; shard images load with
   `loading="eager"` for the primary shard + `fetchpriority="high"`, others
   lazy; fog/base gradient shows during load so the scene never looks broken;
   fade shards in as they decode (150ms opacity, no movement).
3. No-JS fallback: server HTML already contains the full static scene (images +
   copy) — verify by disabling JS; nothing may depend on client mount to become
   visible.
4. Legacy-format fallback: `<picture>` AVIF → WebP → PNG chain verified.
5. Verify all tiers in `/hero-lab` preview switches; `yarn check`.

## Visual requirements

The mobile composition must be art-directed in its own right (not a cropped
desktop): reference-quality balance in portrait.

## Security and privacy requirements

None new.

## Edge cases

- Slow 3G: text readable at 0ms, scene completes progressively without pops.
- Data-saver header/`prefers-reduced-data`: serve mobile tier on desktop.
- Image decode failure: fog-only backdrop is acceptable and intentional.

## Acceptance criteria

- [ ] Mobile tier composed and within 350 KB (recorded).
- [ ] CLS = 0 across tiers (measured, not asserted).
- [ ] Full content visible with JS disabled.
- [ ] Format fallback chain verified in a non-AVIF context.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`
- `yarn build`

## Manual verification

DevTools: mobile emulation + network throttling walkthrough; JS-disabled
walkthrough; screenshot each tier for the completion report.

## Required tests

RTL: hero renders copy and CTA without any effect/mount hooks having run
(static render assertion).

## Completion report

Report: tier inventory, CLS/weight measurements per tier, screenshots list.

## Git checkpoint

`feat(hero): fallbacks and loading strategy`

## Status update

Update `STATUS.md` and the 017 row in `INDEX.md`.
