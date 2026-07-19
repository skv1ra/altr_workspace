# PROMPT 012 — Hero technical prototype

## Current project state

Design system complete (011). Hero experiments exist in LEGACY only
(`components/HeroGlassScene.tsx`, `components/AltrShardScene.tsx`,
`public/hero-shards/*.png`, `scripts/generate-hero-shards.mjs`) — raw material
to copy into WORKSPACE, never edited in place. The reference image is committed
at `references/altr-hero-reference.png` (Prompt 003).

## Objective

Prove or amend ADR-007 (hybrid pre-rendered + lightweight real-time hero) with a
working prototype on an isolated route, measured against explicit kill criteria.

## Why this task exists

The single highest visual and technical risk (RISKS R1). A wrong approach chosen
now costs the whole phase.

## Dependencies

011. Blocked without `references/altr-hero-reference.png` — if absent, stop and
mark blocked in STATUS.md.

## Files to inspect first

- `references/altr-hero-reference.png` (study composition/materials in depth)
- `ARCHITECTURE_DECISIONS.md` ADR-007/008, `DESIGN_DIRECTION.md`
- Legacy hero components + shard assets + generation script
- `middleware.ts` CSP (img/worker/blob allowances)

## Files allowed to change

- `app/(public)/hero-lab/page.tsx` (create — dev-only route, 404 in production)
- `components/hero/` (create — prototype components)
- `public/hero-shards/` (create in WORKSPACE by copying the LEGACY shard PNGs;
  may add prototype variants)
- `scripts/generate-hero-shards.mjs` (copy from LEGACY if useful for iteration)
- `docs/claude-prompts/ARCHITECTURE_DECISIONS.md` (ADR-007 confirmation/amendment)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/page.tsx` (live homepage untouched), `app/api/`, `lib/` (except new
`lib/motion` consumers), `supabase/`, tests.

## Implementation instructions

1. Copy the LEGACY shard assets (`public/hero-shards/*.png`) and, if useful,
   `scripts/generate-hero-shards.mjs` into WORKSPACE (read-only source). Then
   build the hybrid prototype at `/hero-lab`: 4–6 layered shard images (the
   copied assets), fog gradient layers, DOF via pre-blurred variants,
   canvas particle dusting (≤ 60 particles), pointer parallax (caps from
   DESIGN_DIRECTION), slow drift from `lib/motion`.
2. Measure on desktop Chrome: FPS during pointer movement (DevTools), total
   hero asset weight, main-thread blocking, CLS on load.
3. Kill criteria for the hybrid — if ANY fails after honest tuning effort,
   write the failure into ADR-007 and prototype the fallback (Option B video
   loop with HTML overlays) before deciding:
   - sustained ≥ 55 FPS during interaction on desktop;
   - hero assets ≤ 900 KB (desktop tier);
   - CLS contribution 0;
   - visual credibility: side-by-side against the reference, the material reads
     as the same family (user judges — request their confirmation).
4. Record measurements + decision in ADR-007 (confirmed or amended with data).
5. Keep the lab route (Phase 3 iterates on it); ensure production 404 guard.

## Visual requirements

The prototype does not need final art, but the material must already read as
photoreal dark glass in silver fog — not vector shapes.

## Security and privacy requirements

- No new external origins; all assets self-hosted (CSP intact).

## Edge cases

- High-DPR screens (cap effective DPR cost by sizing assets for 2x max).
- Pointer parallax on touch devices must be inert, not broken.

## Acceptance criteria

- [ ] `/hero-lab` renders the prototype; 404s in production build.
- [ ] All four kill-criteria measurements recorded with real numbers.
- [ ] ADR-007 updated with data-backed confirmation or amendment.
- [ ] User has confirmed visual direction against the reference.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`
- `yarn build` (confirm hero-lab excluded/404 in production)

## Manual verification

User views `/hero-lab` beside the reference image and approves direction —
this approval is required before Prompt 013.

## Required tests

A unit test asserting the hero-lab page returns notFound in production env.

## Completion report

Report: measurements table, decision, user approval status, command results.

## Git checkpoint

`feat(hero): hybrid hero technical prototype`

## Status update

Update `STATUS.md` (ADR-007 resolution) and the 012 row in `INDEX.md`.
