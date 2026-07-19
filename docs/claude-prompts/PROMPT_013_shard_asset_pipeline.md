# PROMPT 013 — Shard asset pipeline

## Current project state

Approach confirmed by prototype (012). WORKSPACE assets copied from LEGACY in
012: `public/hero-shards/` (6 PNGs, ~1.7 MB total — over budget) and the
generator `scripts/generate-hero-shards.mjs`.

## Objective

Produce the production shard asset set: reference-grade fragments with baked
lighting/cracks, DOF blur variants, modern formats, within the asset budget.

## Why this task exists

Asset quality is the ceiling of the whole hero; asset weight is the floor of its
performance (RISKS R1, budget in ADR-007).

## Dependencies

012 (user-approved direction).

## Files to inspect first

- `scripts/generate-hero-shards.mjs` (current generation technique)
- `references/altr-hero-reference.png` (crack detail, edge highlights, blur falloff)
- Prototype layer plan from `components/hero/`

## Files allowed to change

- `scripts/generate-hero-shards.mjs` (extend/replace)
- `public/hero-shards/` (new asset set; keep old files until Prompt 014 swaps
  consumers, then delete old ones there)
- `package.json` devDependencies (image tooling like `sharp` — dev-only)
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/`, `components/` (consumers updated in 014), `lib/`, `supabase/`, tests.

## Implementation instructions

1. Define the required set from the 012 layer plan: hero shard (sharp), 2–3
   mid shards, 2 foreground shards (heavily pre-blurred), 2 background shards
   (soft), each needing: base render + blur variant where DOF swaps occur.
2. Improve generation (or document a manual/external creation step the user
   performs) until fragments match the reference: faceted near-black glass,
   1px bright edge chips, hairline cracks, believable internal reflection.
   If script-based generation cannot reach reference quality, say so honestly
   and define the manual asset workflow instead — do not ship placeholder art.
3. Export AVIF + WebP + PNG fallback at 1x/2x; verify alpha edges are clean on
   both light and dark grounds.
4. Enforce budget: desktop tier ≤ 900 KB total, mobile tier ≤ 350 KB (subset +
   smaller sizes). Record actual sizes.
5. `yarn check` (script changes must not break build).

## Visual requirements

Zoom to 200%: crack lines must look etched (varying opacity 10–20% white), not
drawn strokes; edges must carry occasional bright chips; no banding in gradients.

## Security and privacy requirements

- New devDependency (e.g. sharp) pinned exact version; not shipped to client.

## Edge cases

- AVIF encoder artifacts on near-black gradients → tune quality per asset.
- Transparent PNG fallback size explosion → posterize-safe compression.

## Acceptance criteria

- [ ] Full asset set exists in three formats, 1x/2x, with DOF variants.
- [ ] Desktop ≤ 900 KB, mobile ≤ 350 KB (recorded numbers).
- [ ] Visual match confirmed at 200% zoom against reference.
- [ ] Generation or manual workflow documented and reproducible.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`
- `node scripts/generate-hero-shards.mjs` (if script-based)

## Manual verification

User reviews the asset sheet in `/hero-lab` (temporary gallery mode acceptable)
against the reference.

## Required tests

None (assets); script must run without error if kept.

## Completion report

Report: asset inventory with sizes per tier/format, generation method, budget
compliance, command results.

## Git checkpoint

`feat(hero): production shard asset pipeline`

## Status update

Update `STATUS.md` and the 013 row in `INDEX.md`.
