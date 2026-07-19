# PROMPT 015 — Memory fragment content

## Current project state

Final scene composition approved (014).

## Objective

Embed quiet memory artifacts inside/next to selected shards: a voice memo with
waveform, a message excerpt, a date, a memory title, a location label, a short
emotional phrase — as accessible HTML overlays that read as etched inclusions.

## Why this task exists

The scene must communicate the product ("Altr assembles a person's digital
memory"), not just look expensive.

## Dependencies

014.

## Files to inspect first

- `components/hero/` scene structure and shard positioning
- `DESIGN_DIRECTION.md` § Memory-fragment content
- Label typography from 007 (`Label` primitive)

## Files allowed to change

- `components/hero/HeroFragments.tsx` (create), `components/hero/fragments.ts`
  (create — the fragment content data, hand-written fictional content)
- `components/hero/` scene wiring
- `app/(public)/hero-lab/page.tsx`
- `tests/components/`
- `docs/claude-prompts/STATUS.md`, `INDEX.md`

## Files that must not be changed

`app/page.tsx`, `app/api/`, `lib/`, `supabase/`, existing tests.

## Implementation instructions

1. Author 5–6 fictional, emotionally plausible fragments (no real names/data):
   e.g. voice memo "0:42" with a tiny static waveform SVG; a two-line message
   excerpt; "March 14, 2019"; memory title "The apartment on Vysoka St."; a
   location label; a phrase like "you always called first". English; keep them
   restrained, not saccharine.
2. Render each anchored to a shard layer so parallax moves them with their
   glass; style as faint etchings (silver 40–60% opacity, label typography,
   hairline separators), never as cards or chips.
3. Accessibility: fragments are decorative-but-real content — group them in a
   labeled region (`aria-label="Examples of remembered moments"`); waveform SVG
   `aria-hidden` with text alternative in the memo label.
4. Ensure fragments never fight the headline for attention: max 2 simultaneously
   sharp; others soften with their DOF layer.
5. Iterate in `/hero-lab`; `yarn check`.

## Visual requirements

Fragments must look like they live in the glass (clipped/masked to shard
silhouettes where overlapping, opacity following shard focus), not stickers on
top. Waveform is thin-line, monochrome.

## Security and privacy requirements

- All fragment content fictional; no real personal data, no real phone/location.

## Edge cases

- Long localization strings (UA later) must truncate gracefully inside masks.
- High-contrast mode: fragments may disappear (acceptable) but must not leave
  broken artifacts.

## Acceptance criteria

- [ ] 5–6 fragments rendered, anchored, masked, accessible.
- [ ] Content is fictional and restrained; user approves the writing.
- [ ] Headline hierarchy still dominant.
- [ ] `yarn check` passes.

## Verification commands

- `yarn check`

## Manual verification

Read the scene at arm's length: headline first, shards second, fragments
discovered third. Screen-reader pass over the fragment region.

## Required tests

RTL: fragments region renders with its aria-label and all fragment titles.

## Completion report

Report: fragment inventory, anchoring approach, a11y notes, command results.

## Git checkpoint

`feat(hero): memory fragment content overlays`

## Status update

Update `STATUS.md` and the 015 row in `INDEX.md`.
