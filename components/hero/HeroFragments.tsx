import type { CSSProperties } from "react";
import styles from "./HeroFragments.module.css";
import { HERO_FRAGMENTS, type HeroFragment } from "./fragments";

/*
 * Two layers, deliberately separate:
 *
 *  - HeroFragmentGlyph: the decorative visual etching, rendered by
 *    HeroLayers.tsx as a real DOM child of its anchor shard's own div (so it
 *    inherits that shard's position/rotation, and will move with it once
 *    Prompt 016 adds parallax/drift) — aria-hidden, since it's a styled
 *    duplicate of real content, not the content itself.
 *  - HeroFragmentsAccessibleList: the one real, accessible copy — visually
 *    hidden (`sr-only`), grouped under a single aria-label, so screen-reader
 *    users get a clean list instead of hunting through five scattered,
 *    rotated, 40-60%-opacity text fragments spread across an aria-hidden
 *    decorative image field.
 */

// Fraction of the host shard's own blur carried over to its fragment text —
// this is how "others soften with their DOF layer" is enforced
// structurally rather than by hand-picking a value per fragment. Capped low
// (not proportionally scaled all the way up): the background-tier shards
// are blurred 6-10px and, once that soft, read as a near-uniform gray
// silhouette with almost no internal light/dark contrast for text to sit
// against — verified directly by screenshotting each host shard in
// isolation (see STATUS.md) — so blurring their fragment text by the same
// proportion made it functionally invisible, not just "soft."
function fragmentBlur(hostBlur: number): number {
  if (hostBlur <= 0) return 0;
  return Math.min(hostBlur * 0.25, 2);
}

// Base etched-look opacity (this prompt's own 40-60% range). Sharper shards
// get the top of that range; background-tier shards still get 0.5, not the
// floor a strict host-opacity multiplier would give (~0.25) — the same
// screenshot check showed 0.4 opacity read as fully invisible once the host
// shard itself was already down to 0.4 opacity with no internal contrast.
// Monotonic with host opacity (sharper host -> more prominent fragment),
// just with a legibility floor a fragment nobody can ever read would fail
// this prompt's own objective regardless of how well it "matches" its DOF
// tier.
function fragmentOpacity(hostOpacity: number): number {
  if (hostOpacity >= 0.8) return 0.6;
  if (hostOpacity >= 0.5) return 0.55;
  return 0.5;
}

export function HeroFragmentGlyph({
  fragment,
  hostBlur,
  hostOpacity,
}: {
  fragment: HeroFragment;
  hostBlur: number;
  hostOpacity: number;
}) {
  const blur = fragmentBlur(hostBlur);
  const opacity = fragmentOpacity(hostOpacity);

  return (
    <div
      className={styles.fragment}
      aria-hidden="true"
      // Resting/revealed opacity+blur are handed to CSS as custom
      // properties (not applied directly) so HeroFragments.module.css can
      // own the hover choreography: the glass reads clear until the shard
      // is hovered, then the memory fades/sharpens in to exactly these
      // measured per-tier values. See `.fragment` rules for the states.
      style={
        {
          left: `${fragment.x}%`,
          top: `${fragment.y}%`,
          width: `${fragment.width}%`,
          "--fragment-opacity": opacity,
          "--fragment-blur": `${blur}px`,
        } as CSSProperties
      }
    >
      {fragment.kicker && <p className={styles.kicker}>{fragment.kicker}</p>}
      <p className={fragment.italic ? `${styles.title} ${styles.titleItalic}` : styles.title}>
        {fragment.title}
      </p>
      {fragment.detail?.map((line, index) => (
        <p key={index} className={styles.detail}>
          {line}
        </p>
      ))}
      {fragment.waveform && (
        <div className={styles.waveformRow}>
          <svg
            className={styles.waveformSvg}
            width={fragment.waveform.bars.length * 4}
            height={14}
            aria-hidden="true"
          >
            {fragment.waveform.bars.map((height, index) => (
              <rect key={index} x={index * 4} y={14 - height} width={2} height={height} rx={1} fill="currentColor" />
            ))}
          </svg>
          {/* The waveform's real text alternative — not just an aria-label
              on the SVG, an actually-rendered, always-visible-to-AT line. */}
          <span className={styles.timestamp}>{fragment.waveform.duration}</span>
        </div>
      )}
    </div>
  );
}

export function HeroFragmentsAccessibleList() {
  return (
    <div className="sr-only" role="group" aria-label="Examples of remembered moments">
      {HERO_FRAGMENTS.map((fragment) => (
        <p key={fragment.id}>
          {fragment.kicker && <span>{fragment.kicker}. </span>}
          <span>{fragment.title}</span>
          {fragment.detail?.map((line, index) => (
            <span key={index}>. {line}</span>
          ))}
          {fragment.waveform && <span>. Duration {fragment.waveform.duration}</span>}
        </p>
      ))}
    </div>
  );
}
