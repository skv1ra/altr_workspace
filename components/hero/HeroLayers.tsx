import type { CSSProperties } from "react";
import { HeroFragmentGlyph } from "./HeroFragments";
import { heroFragmentsFor } from "./fragments";
import styles from "./HeroScene.module.css";

/*
 * Shard field for the final static composition (Prompt 014). Still only the
 * 8 real supplied shard assets (public/assets/hero/shards-trimmed/) —
 * there is no image-generation model available to make genuinely new
 * photoreal glass art, and procedural stand-ins were tried and rejected in
 * Prompt 012/ADR-007 for looking flat/matte. Variety comes from placing the
 * same assets at different crops/scales/rotations.
 *
 * Depth planes:
 *   - "back" tier: far (small, blur 6-10px, opacity 0.38-0.45 — distant,
 *     atmospheric) and mid-ground (sharp to lightly soft, blur 0-3px,
 *     carries the visual weight, including the memory-etched main shard).
 *     Rendered before HeroCopy in the scene, per this prompt's layer order.
 *   - "front" tier: foreground shards, heavily pre-blurred (18-22px),
 *     cropped/pushed to the bottom-left and bottom-right viewport edges so
 *     they partially bleed off-frame. Rendered *after* HeroCopy, and at a
 *     higher z-index than it, so this tier optically sits nearer the
 *     "camera" than the headline — the actual depth-of-field story the
 *     prompt asks for, not just a visual label.
 *
 * Positioned by CENTER (left/top % + translate(-50%,-50%)), sized by
 * whichever single dimension (vw or vh) is given priority per role, the
 * other left to the asset's real aspect ratio (alpha-trimmed copies in
 * shards-trimmed/ — trimming avoids each image's own transparent padding
 * throwing off percentage-based sizing).
 *
 * "small-central" and "upper-center-blurred" are nudged a few extra percent
 * right of a first-pass placement that left only ~0.25-1.5% clearance from
 * the headline clear-space box's right edge (x 45%) — too tight once each
 * shard's own rotation (6-8deg) grows its effective bounding box; verified
 * with real screenshots (see STATUS.md 014 entry) that neither shard
 * intersects the box at 1440px or 1920px.
 *
 * Prompt 017 (mobile / reduced-data tier, ADR-008): each shard optionally
 * carries a `mobile` placement (x/y/sizeValue — same units/basis as its
 * desktop placement, sizeBasis/rotate/blur/opacity unchanged). Shards
 * without one are structurally absent below the 768px container-inline-size
 * breakpoint and under `prefers-reduced-data: reduce` (the "serve mobile
 * tier on desktop" edge case) — see `.hiddenOnMobile` in
 * HeroScene.module.css and ShardPicture's TRANSPARENT_PIXEL swap below,
 * which also keeps their real (desktop-only) assets from ever being
 * fetched in that tier, not just hidden. The 4 shards that keep a `mobile`
 * placement (`main`, `small-central`, `upper-center-blurred`,
 * `lower-left-foreground`) preserve one sharp memory-carrying piece, one
 * small sharp accent, one soft atmospheric wash, and the foreground
 * edge-bleed — recomposed lower in the frame so none starts above mobile
 * HeroCopy's own clear-space box (top 8%, height budget ~40% — see
 * HeroCopy.module.css), the same never-intersect-the-copy discipline as
 * the desktop box, checked against real Playwright screenshots at 390px
 * (see STATUS.md 017 entry) the same way 014 checked the desktop box.
 */
type SizeBasis = "width" | "height";
export type ShardTier = "back" | "front";

interface ShardPlacement {
  x: number;
  y: number;
  sizeValue: number; // vw if sizeBasis === "width", vh if "height"
}

type ShardDef = {
  id: string;
  role: string;
  /** Extensionless path into shards-trimmed/ — format/resolution variants
   * are resolved by ShardPicture (`${base}.ext`, `${base}@1x.ext`). */
  base: string;
  w: number;
  h: number;
  x: number;
  y: number;
  sizeBasis: SizeBasis;
  sizeValue: number; // vw if sizeBasis === "width", vh if "height"
  rotate: number;
  blur: number;
  opacity: number;
  z: number;
  tier: ShardTier;
  /** Pointer-parallax cap in px (DESIGN_DIRECTION: <=10 foreground,
   * <=4 background) — also drives this shard's scroll-separation distance
   * (see `scrollOffsetPx` below), so sharper/nearer shards move more under
   * both pointer and scroll, consistently. */
  parallaxPx: number;
  /** Negative animation-delay (seconds) into the shared 24s `altr-drift`
   * cycle — every shard uses the same keyframes/amplitude ceiling, so this
   * is the only thing that keeps them from all drifting in lockstep. */
  driftDelay: number;
  /** Mobile/reduced-data placement (Prompt 017). Absent = this shard is
   * structurally hidden in that tier, not just scaled down. */
  mobile?: ShardPlacement;
};

export const SHARDS: ShardDef[] = [
  {
    id: "main",
    role: "Main shard",
    base: "/assets/hero/shards-trimmed/shard-main",
    w: 1102,
    h: 651,
    x: 71,
    y: 56,
    sizeBasis: "width",
    sizeValue: 38,
    rotate: -4,
    blur: 0,
    opacity: 1,
    z: 5,
    tier: "back",
    parallaxPx: 8,
    driftDelay: 0,
    mobile: { x: 58, y: 70, sizeValue: 68 },
  },
  {
    id: "lower-mid-support",
    role: "Small lower-mid support shard",
    base: "/assets/hero/shards-trimmed/shard-mid-03",
    w: 1279,
    h: 665,
    x: 35,
    y: 88,
    sizeBasis: "width",
    sizeValue: 20,
    rotate: 9,
    blur: 3,
    opacity: 0.85,
    z: 4,
    tier: "back",
    parallaxPx: 7,
    driftDelay: -4,
  },
  {
    // y nudged up (16 -> 10): a real-viewport measurement (see STATUS.md
    // 014 entry) found this shard's rendered box reaching ~29% down the
    // viewport — well past the headline box's ~28.5% top edge at 1440px —
    // because sizing this by vw width and letting height go "auto" off a
    // 0.697 aspect ratio makes the height, in vh terms, notably taller than
    // the vw number alone suggests. Moved up for real, verified clearance.
    id: "upper-left-background",
    role: "Upper-left background shard",
    base: "/assets/hero/shards-trimmed/shard-mid-02",
    w: 481,
    h: 690,
    x: 16,
    y: 10,
    sizeBasis: "width",
    sizeValue: 13,
    rotate: -14,
    blur: 9,
    opacity: 0.4,
    z: 1,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -9,
  },
  {
    id: "far-right-background",
    role: "Far-right background shard",
    base: "/assets/hero/shards-trimmed/shard-mid-03",
    w: 1279,
    h: 665,
    x: 96,
    y: 55,
    sizeBasis: "width",
    sizeValue: 15,
    rotate: -5,
    blur: 6,
    opacity: 0.42,
    z: 1,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -14,
  },
  {
    // Nudged right (54 -> 57) for extra clearance from the headline box's
    // right edge (45%) once this shard's 6deg rotation is accounted for.
    id: "upper-center-blurred",
    role: "Upper-center blurred shard",
    base: "/assets/hero/shards-trimmed/shard-mid-01",
    w: 1025,
    h: 635,
    x: 57,
    y: 10,
    sizeBasis: "width",
    sizeValue: 19,
    rotate: 6,
    blur: 10,
    opacity: 0.4,
    z: 2,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -19,
    mobile: { x: 16, y: 84, sizeValue: 40 },
  },
  {
    id: "upper-right-distant",
    role: "Small upper-right distant shard",
    base: "/assets/hero/shards-trimmed/shard-background-01",
    w: 420,
    h: 540,
    x: 72,
    y: 17,
    sizeBasis: "width",
    sizeValue: 11,
    rotate: -10,
    blur: 8,
    opacity: 0.4,
    z: 1,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -2,
  },
  {
    // Nudged right (49 -> 52) for extra clearance from the headline box's
    // right edge (45%) once this shard's 8deg rotation is accounted for.
    id: "small-central",
    role: "Small central fragment",
    base: "/assets/hero/shards-trimmed/shard-foreground-02",
    w: 319,
    h: 437,
    x: 52,
    y: 44,
    sizeBasis: "width",
    sizeValue: 9.5,
    rotate: 8,
    blur: 0,
    opacity: 0.85,
    z: 3,
    tier: "back",
    parallaxPx: 8,
    driftDelay: -11,
    // x pulled in from a first-pass 86 -> 74: at 86% this shard's rotated
    // (8deg) bounding box, plus its "date" memory-fragment glyph (which
    // extends to 86% of the shard's own width, not clipped by any
    // overflow), pushed past the 390px viewport's right edge — checked
    // against a real screenshot at 390px (see STATUS.md 017 entry), same
    // discipline as the desktop shards' own clearance nudges above.
    mobile: { x: 74, y: 58, sizeValue: 20 },
  },
  {
    id: "mid-right-support",
    role: "Mid-right support fragment",
    base: "/assets/hero/shards-trimmed/shard-foreground-02",
    w: 319,
    h: 437,
    x: 82,
    y: 74,
    sizeBasis: "width",
    sizeValue: 8,
    rotate: -16,
    blur: 1,
    opacity: 0.9,
    z: 4,
    tier: "back",
    parallaxPx: 7,
    driftDelay: -17,
  },
  {
    // Density pass (user request: "more glass"): four extra desktop-only
    // placements of the same real renders, all verified clear of the
    // headline clear-space box (x 7-45%, y 31-70%) — top strip, right
    // column, and the lower-center gap. No `mobile` placement: the mobile
    // tier keeps its lightweight 4-shard budget untouched.
    id: "upper-far-left-distant",
    role: "Upper-far-left distant shard",
    base: "/assets/hero/shards-trimmed/shard-background-01",
    w: 420,
    h: 540,
    x: 5,
    y: 18,
    sizeBasis: "width",
    sizeValue: 8,
    rotate: 18,
    blur: 9,
    opacity: 0.4,
    z: 1,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -7,
  },
  {
    id: "mid-top-accent",
    role: "Mid-top accent fragment",
    base: "/assets/hero/shards-trimmed/shard-foreground-02",
    w: 319,
    h: 437,
    x: 66,
    y: 32,
    sizeBasis: "width",
    sizeValue: 7,
    rotate: -12,
    blur: 2,
    opacity: 0.85,
    z: 3,
    tier: "back",
    parallaxPx: 8,
    driftDelay: -13,
  },
  {
    id: "right-upper-mass",
    role: "Right-upper supporting mass",
    base: "/assets/hero/shards-trimmed/shard-mid-02",
    w: 481,
    h: 690,
    x: 88,
    y: 30,
    sizeBasis: "width",
    sizeValue: 12,
    rotate: 10,
    blur: 5,
    opacity: 0.55,
    z: 2,
    tier: "back",
    parallaxPx: 5,
    driftDelay: -23,
  },
  {
    id: "lower-center-distant",
    role: "Lower-center distant shard",
    base: "/assets/hero/shards-trimmed/shard-background-01",
    w: 420,
    h: 540,
    x: 55,
    y: 80,
    sizeBasis: "width",
    sizeValue: 7,
    rotate: -24,
    blur: 7,
    opacity: 0.45,
    z: 1,
    tier: "back",
    parallaxPx: 4,
    driftDelay: -16,
  },
  {
    // Foreground tier: heavily pre-blurred, cropped against the bottom-left
    // viewport edge — z raised above HeroCopy's z-10 so it optically sits
    // in front of the headline block per this prompt's layer order.
    id: "lower-left-foreground",
    role: "Lower-left foreground fragment",
    base: "/assets/hero/shards-trimmed/shard-foreground-01",
    w: 383,
    h: 724,
    x: 7,
    y: 94,
    sizeBasis: "height",
    sizeValue: 31,
    rotate: -8,
    blur: 18,
    opacity: 0.92,
    z: 15,
    tier: "front",
    parallaxPx: 10,
    driftDelay: -6,
    mobile: { x: 4, y: 98, sizeValue: 20 },
  },
  {
    // Foreground tier: heavily pre-blurred, cropped against the bottom-right
    // viewport edge — same z-order reasoning as the lower-left piece.
    id: "lower-right-foreground",
    role: "Lower-right foreground mass",
    base: "/assets/hero/shards-trimmed/shard-background-02",
    w: 685,
    h: 200,
    x: 92,
    y: 94,
    sizeBasis: "width",
    sizeValue: 36,
    rotate: 3,
    blur: 22,
    opacity: 0.8,
    z: 16,
    tier: "front",
    parallaxPx: 10,
    driftDelay: -21,
  },
];

// Reference viewport this composition was tuned/measured against (this
// prompt's own manual-verification widths: 1440/1920px; 1920x1080 covers
// both). Sizing beyond this point is capped with CSS min() rather than left
// to keep scaling with vw/vh — otherwise the shard field keeps growing past
// an ultra-wide (>1920px) viewport while the headline stays font-clamped,
// which both crowds the clear-space box and reads as oversized. Below the
// reference, vw/vh scaling still applies untouched (shards shrink normally
// on narrower/shorter viewports).
const REFERENCE_VW_PX = 1920;
const REFERENCE_VH_PX = 1080;

function shardSize(sizeBasis: SizeBasis, sizeValue: number): { width: string; height: string } {
  if (sizeBasis === "width") {
    const capPx = (sizeValue / 100) * REFERENCE_VW_PX;
    return { width: `min(${sizeValue}vw, ${capPx.toFixed(1)}px)`, height: "auto" };
  }
  const capPx = (sizeValue / 100) * REFERENCE_VH_PX;
  return { width: "auto", height: `min(${sizeValue}vh, ${capPx.toFixed(1)}px)` };
}

// Scroll-separation distance/direction: reuses each shard's own parallaxPx
// (nearer/sharper shards separate more, same as they parallax more) and
// radiates outward from the composition's center (50%, 50%) — "a few
// percent along their depth axis" read as each shard drifting away from
// the center as the scene "opens up" on scroll, capped well under the
// >=55 FPS-safe, transform-only budget this prompt requires.
const SCROLL_SEPARATION_FACTOR = 2.5;
const SCROLL_SEPARATION_CAP_PX = 30;

export function scrollSeparationPx(shard: ShardDef): { dx: number; dy: number } {
  const dirX = Math.sign(shard.x - 50) || 1;
  const dirY = Math.sign(shard.y - 50) || 1;
  const magnitude = Math.min(shard.parallaxPx * SCROLL_SEPARATION_FACTOR, SCROLL_SEPARATION_CAP_PX);
  return { dx: dirX * magnitude, dy: dirY * magnitude };
}

// 1x1 transparent PNG (67 bytes, inlined — no network request). Used as the
// mobile/reduced-data <source> for shards that have no `mobile` placement:
// `<picture>` picks the first matching <source> purely by `media`, before
// even considering `type` support, so a mobile viewport (or
// prefers-reduced-data) resolves straight to this placeholder instead of
// ever requesting the shard's real (desktop-only, heavier) asset —
// `.hiddenOnMobile` (HeroScene.module.css) then keeps it out of layout too.
// This is what actually keeps the mobile tier's delivered weight to the 4
// chosen shards' @1x assets, not "10 shards' worth of hidden <img> tags" —
// a bare CSS `display:none` on an <img> does not stop the browser from
// fetching its src.
const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Matches HeroScene.module.css's container-query breakpoint. Combined with
// `prefers-reduced-data` (ADR-008's "serve mobile tier on desktop" edge
// case) as an OR — the HTML `media` attribute accepts a comma-separated
// media query list, which is exactly OR semantics.
const MOBILE_SOURCE_MEDIA = "(max-width: 768px), (prefers-reduced-data: reduce)";

/**
 * Renders one shard's format/resolution fallback chain: AVIF -> WebP -> PNG,
 * each offered at the mobile/reduced-data (@1x) resolution first (only
 * reachable when `MOBILE_SOURCE_MEDIA` matches), then the desktop (2x)
 * resolution — or, for shards with no `mobile` placement, the mobile branch
 * points at the shared transparent pixel instead of a real @1x asset.
 *
 * Plain `<picture>`/`<img>`, not `next/image`: this prompt asks for a real,
 * inspectable AVIF -> WebP -> PNG `<source>` chain and viewport-conditional
 * `<source media>` art-direction, neither of which next/image's own
 * (single-`<img>`, content-negotiated-by-the-optimizer) output produces.
 */
// Shards this soft or softer swap to the pre-blurred asset variants
// (`${base}-blur.*`) instead of a live CSS `filter: blur()`. Live blur on a
// large, drifting, parallaxing layer forces expensive re-rasterization; a
// baked blur is raster-free. Small softenings (1-3px) stay as cheap CSS
// filters, since no per-level baked variant exists.
const PREBLURRED_ASSET_MIN_PX = 5;

function ShardPicture({ shard, isPrimary }: { shard: ShardDef; isPrimary: boolean }) {
  const desktopSize = shardSize(shard.sizeBasis, shard.sizeValue);
  const mobileSize = shard.mobile ? shardSize(shard.sizeBasis, shard.mobile.sizeValue) : undefined;

  const usePreblurred = shard.blur >= PREBLURRED_ASSET_MIN_PX;
  const assetBase = usePreblurred ? `${shard.base}-blur` : shard.base;
  const cssBlur = usePreblurred ? 0 : shard.blur;

  const mobileAvif = shard.mobile ? `${assetBase}@1x.avif` : TRANSPARENT_PIXEL;
  const mobileWebp = shard.mobile ? `${assetBase}@1x.webp` : TRANSPARENT_PIXEL;
  const fallbackSrc = shard.mobile ? `${assetBase}@1x.png` : TRANSPARENT_PIXEL;

  const imgStyle: CSSProperties = {
    "--w-desktop": desktopSize.width,
    "--h-desktop": desktopSize.height,
    ...(mobileSize && { "--w-mobile": mobileSize.width, "--h-mobile": mobileSize.height }),
    filter: cssBlur > 0 ? `blur(${cssBlur}px)` : undefined,
  } as CSSProperties;

  return (
    <picture>
      <source media={MOBILE_SOURCE_MEDIA} type="image/avif" srcSet={mobileAvif} />
      <source media={MOBILE_SOURCE_MEDIA} type="image/webp" srcSet={mobileWebp} />
      <source type="image/avif" srcSet={`${assetBase}.avif`} />
      <source type="image/webp" srcSet={`${assetBase}.webp`} />
      <img
        src={fallbackSrc}
        alt=""
        width={shard.w}
        height={shard.h}
        className={styles.shardImg}
        style={imgStyle}
        // Zero-CLS loading strategy (Prompt 017): the primary (sharpest,
        // memory-carrying) shard decodes first and is marked high-priority;
        // every other shard is lazy — width/height above already reserve
        // each one's layout box regardless of decode timing, so lazy
        // loading costs no layout shift, only decode order. Supersedes
        // Prompt 016's "all eager" note for this prompt's own explicit
        // eager-primary/lazy-rest instruction.
        loading={isPrimary ? "eager" : "lazy"}
        fetchPriority={isPrimary ? "high" : undefined}
        draggable={false}
      />
    </picture>
  );
}

export function HeroLayers({
  tier,
  reducedMotion,
  registerShardEl,
}: {
  tier: ShardTier;
  reducedMotion: boolean;
  /** Registers (or, called with `null`, unregisters) this shard's DOM node
   * so HeroScene's useHeroShardMotion can write pointer/scroll offsets
   * directly to it — see that hook for why this bypasses CSS custom
   * properties for shard transforms specifically. */
  registerShardEl: (id: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <>
      {SHARDS.filter((shard) => shard.tier === tier).map((shard) => {
        const wrapperStyle: CSSProperties = {
          "--x-desktop": `${shard.x}%`,
          "--y-desktop": `${shard.y}%`,
          ...(shard.mobile && {
            "--x-mobile": `${shard.mobile.x}%`,
            "--y-mobile": `${shard.mobile.y}%`,
          }),
          opacity: shard.opacity,
          zIndex: shard.z,
          // Static base only — centers and tilts this shard once, at
          // render. The dynamic pointer/scroll offset is applied by
          // useHeroShardMotion via the separate `translate` CSS *property*
          // (composes before `transform`), not baked into this string, so
          // it never needs recomputing here.
          transform: `translate(-50%, -50%) rotate(${shard.rotate}deg)`,
          animationDelay: reducedMotion ? undefined : `${shard.driftDelay}s`,
        } as CSSProperties;

        // "hero-shard" is a plain global class (not a CSS-module class) so
        // HeroFragments.module.css can scope its hover-reveal rule to the
        // hovered shard wrapper across module boundaries.
        const classNames = [styles.shard, "hero-shard"];
        if (!reducedMotion) classNames.push("motion-drift");
        if (!shard.mobile) classNames.push(styles.hiddenOnMobile);

        return (
          <div
            key={shard.id}
            ref={(el) => registerShardEl(shard.id, el)}
            className={classNames.join(" ")}
            style={wrapperStyle}
          >
            <ShardPicture shard={shard} isPrimary={shard.id === "main"} />
            {heroFragmentsFor(shard.id).map((fragment) => (
              <HeroFragmentGlyph key={fragment.id} fragment={fragment} hostBlur={shard.blur} hostOpacity={shard.opacity} />
            ))}
          </div>
        );
      })}
    </>
  );
}
