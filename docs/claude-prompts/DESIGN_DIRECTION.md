# Design direction

Source of truth: the hero reference at `references/altr-hero-reference.png`
(full-resolution, 1318×716-class screenshot, supplied 2026-07-19 and inspected
in full). The reference is inspiration, never a production background.

## What the reference shows (verified from the full image)

- Light, silver-white cloud/fog atmosphere with a cool blue-gray cast; implied
  soft key light from the upper left; faint bokeh dust specks throughout.
- Dark obsidian glass shards floating at many depths. Crack treatment is
  **dramatic, not subtle**: bright white spiderweb/shatter vein networks run
  across the large shards, with brilliant chipped edges catching light. Some
  shards are razor-sharp in focus; foreground and far shards are heavily
  DOF-blurred (bottom-right holds a large, strongly blurred foreground shard).
- The focal shard (right of center, large triangle) carries etched memory
  content in light silver type inside the glass:
  `MAY 17, 2018` (letterspaced caps date) · `VOICE MEMO` label · a two-line
  message excerpt · a thin waveform with `0:23` duration. This confirms the
  fragment-content spec exactly (date + voice memo + waveform + excerpt).
- A second large, heavily cracked shard anchors the bottom edge in sharp focus,
  cropped by the viewport.
- Minimal top navigation: small dark shard-glyph + "Altr" wordmark left;
  `Product · How it works · Pricing · Log in` right, small dark text.
- Headline left, on two lines: "Your past learns / to remain." — very light
  weight grotesque at display size, dark graphite, generous negative space.
- Support line beneath: "A digital continuation of you, shaped by memory,
  style, and time."
- CTA: "Create your Altr" — solid obsidian button, modest corner radius
  (rounded rectangle, not a pill), white label, left-aligned under the copy.

Implementation notes derived from the full image:
- Crack veins are a primary material signature — Prompt 013 assets must carry
  bold branching white crack networks on the large shards, not only hairlines.
- The composition is text-left / shard-field-right with the focal shard
  overlapping the horizontal midline; foreground blur frames both bottom corners.
- Fragment etching sits centered inside the focal shard's face and follows its
  perspective plane (skewed/tilted with the glass).

## Palette (cinematic white / silver / graphite / black)

| Token | Value (starting point) | Use |
| --- | --- | --- |
| `--altr-white` | `#F5F6F7` | page ground, fog highlights |
| `--altr-silver` | `#D9DDE1` | atmosphere mid-tone, hairlines |
| `--altr-mist` | `#B9C0C7` | fog shadow, secondary text on light |
| `--altr-graphite` | `#3A3F45` | body text, UI chrome on light |
| `--altr-obsidian` | `#15171A` | shards, dark surfaces, headline |
| `--altr-black` | `#0A0B0C` | deepest shard facets, footer ground |
| Accent | none | light itself is the accent — no brand color, no neon |

Dark authenticated surfaces invert the same scale (obsidian ground, silver text).

## Typography

- One premium grotesque family, self-hosted variable font via `next/font`
  (recommended: Inter Variable tuned with -2% letter-spacing at display sizes,
  or Geist). No second display family.
- Display: 300–400 weight, tight leading (1.02–1.08), sizes fluid via clamp()
  (hero ≈ clamp(2.6rem, 6.5vw, 5.5rem)).
- Body: 400/500, 1.6 leading, max measure 68ch.
- Labels/metadata inside glass fragments: 11–12px, 500 weight, +6% tracking,
  uppercase sparingly.

## Materials and surfaces

- **Obsidian glass**: near-black surface with subtle facet gradients, 1px bright
  edge highlight, hairline crack strokes at 10–20% white, soft internal
  reflections. Never a flat black rectangle.
- **Fog**: layered radial/linear gradients of `--altr-white` → transparent;
  slow opacity drift only.
- **Light surfaces**: paper-flat `--altr-white` with hairline `--altr-silver`
  rules; shadows are soft, large-radius, low-opacity (`0 24px 80px rgb(10 11 12 / 8%)`).
- Forbidden: cheap glassmorphism (frosted cards with white borders everywhere),
  random neon glow, heavy gradients, generic AI illustrations, rounded-card grids.

## Motion

- Slow and confident: ambient drift 12–30s loops, ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- Micro-interactions 150–250ms; entrances 500–700ms with 40–80ms stagger; nothing bounces.
- Pointer parallax: max ±10px foreground, ±4px background, lerp-smoothed.
- Scroll: shards separate slightly and fog thins as the user scrolls; text always readable.
- `prefers-reduced-motion`: all drift/parallax off; opacity-only transitions.

## Layout principles

- Generous negative space; content column max 1200px with wide margins.
- Strong left-aligned editorial hierarchy on public pages.
- Dashboard: restrained dark surfaces, hairline dividers, one clear focal action
  per view; data displayed as calm editorial lists/tables, not card grids.
- Empty/loading/error states are designed (short editorial copy + quiet visual),
  never browser-default or blank.

## Memory-fragment content (inside hero shards)

Realistic, quiet artifacts — a voice memo (duration + small waveform), a
two-line message excerpt, a date ("March 14, 2019"), a memory title, a location
label, a short emotional phrase. Rendered as HTML overlays (accessible), styled
as faint etchings/inclusions in the glass, never as UI cards floating on top.

## Copy voice

Calm, precise, slightly literary. Hero copy is fixed (see MASTER_CONTEXT).
Never exclamation marks, never "supercharge/unlock/revolutionize".

## Quality bar

A screen passes only if it would be credible on a premium hardware brand's site.
"Technically functional" is not approval — Prompt 049 (visual QA) compares every
surface against the reference for composition, scale, material realism, blur
quality, motion restraint, and consistency.
