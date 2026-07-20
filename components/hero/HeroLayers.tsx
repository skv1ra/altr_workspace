import Image from "next/image";
import { MemoryFragment } from "./MemoryFragment";
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
 */
type SizeBasis = "width" | "height";
export type ShardTier = "back" | "front";

type ShardDef = {
  id: string;
  role: string;
  src: string;
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
  withMemoryFragment?: boolean;
};

const SHARDS: ShardDef[] = [
  {
    id: "main",
    role: "Main shard",
    src: "/assets/hero/shards-trimmed/shard-main.png",
    w: 1102,
    h: 651,
    x: 71,
    y: 56,
    sizeBasis: "width",
    sizeValue: 30,
    rotate: -4,
    blur: 0,
    opacity: 1,
    z: 5,
    tier: "back",
    withMemoryFragment: true,
  },
  {
    id: "lower-mid-support",
    role: "Small lower-mid support shard",
    src: "/assets/hero/shards-trimmed/shard-mid-03.png",
    w: 1279,
    h: 665,
    x: 35,
    y: 88,
    sizeBasis: "width",
    sizeValue: 16,
    rotate: 9,
    blur: 3,
    opacity: 0.85,
    z: 4,
    tier: "back",
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
    src: "/assets/hero/shards-trimmed/shard-mid-02.png",
    w: 481,
    h: 690,
    x: 16,
    y: 10,
    sizeBasis: "width",
    sizeValue: 11,
    rotate: -14,
    blur: 9,
    opacity: 0.4,
    z: 1,
    tier: "back",
  },
  {
    id: "far-right-background",
    role: "Far-right background shard",
    src: "/assets/hero/shards-trimmed/shard-mid-03.png",
    w: 1279,
    h: 665,
    x: 96,
    y: 55,
    sizeBasis: "width",
    sizeValue: 12.5,
    rotate: -5,
    blur: 6,
    opacity: 0.42,
    z: 1,
    tier: "back",
  },
  {
    // Nudged right (54 -> 57) for extra clearance from the headline box's
    // right edge (45%) once this shard's 6deg rotation is accounted for.
    id: "upper-center-blurred",
    role: "Upper-center blurred shard",
    src: "/assets/hero/shards-trimmed/shard-mid-01.png",
    w: 1025,
    h: 635,
    x: 57,
    y: 10,
    sizeBasis: "width",
    sizeValue: 15,
    rotate: 6,
    blur: 10,
    opacity: 0.4,
    z: 2,
    tier: "back",
  },
  {
    id: "upper-right-distant",
    role: "Small upper-right distant shard",
    src: "/assets/hero/shards-trimmed/shard-background-01.png",
    w: 420,
    h: 540,
    x: 72,
    y: 17,
    sizeBasis: "width",
    sizeValue: 9,
    rotate: -10,
    blur: 8,
    opacity: 0.4,
    z: 1,
    tier: "back",
  },
  {
    // Nudged right (49 -> 52) for extra clearance from the headline box's
    // right edge (45%) once this shard's 8deg rotation is accounted for.
    id: "small-central",
    role: "Small central fragment",
    src: "/assets/hero/shards-trimmed/shard-foreground-02.png",
    w: 319,
    h: 437,
    x: 52,
    y: 44,
    sizeBasis: "width",
    sizeValue: 7.5,
    rotate: 8,
    blur: 0,
    opacity: 0.85,
    z: 3,
    tier: "back",
  },
  {
    id: "mid-right-support",
    role: "Mid-right support fragment",
    src: "/assets/hero/shards-trimmed/shard-foreground-02.png",
    w: 319,
    h: 437,
    x: 82,
    y: 74,
    sizeBasis: "width",
    sizeValue: 6,
    rotate: -16,
    blur: 1,
    opacity: 0.9,
    z: 4,
    tier: "back",
  },
  {
    // Foreground tier: heavily pre-blurred, cropped against the bottom-left
    // viewport edge — z raised above HeroCopy's z-10 so it optically sits
    // in front of the headline block per this prompt's layer order.
    id: "lower-left-foreground",
    role: "Lower-left foreground fragment",
    src: "/assets/hero/shards-trimmed/shard-foreground-01.png",
    w: 383,
    h: 724,
    x: 7,
    y: 94,
    sizeBasis: "height",
    sizeValue: 26,
    rotate: -8,
    blur: 18,
    opacity: 0.92,
    z: 15,
    tier: "front",
  },
  {
    // Foreground tier: heavily pre-blurred, cropped against the bottom-right
    // viewport edge — same z-order reasoning as the lower-left piece.
    id: "lower-right-foreground",
    role: "Lower-right foreground mass",
    src: "/assets/hero/shards-trimmed/shard-background-02.png",
    w: 685,
    h: 200,
    x: 92,
    y: 94,
    sizeBasis: "width",
    sizeValue: 30,
    rotate: 3,
    blur: 22,
    opacity: 0.8,
    z: 16,
    tier: "front",
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

function shardSize(shard: ShardDef): { width: string; height: string } {
  if (shard.sizeBasis === "width") {
    const capPx = (shard.sizeValue / 100) * REFERENCE_VW_PX;
    return { width: `min(${shard.sizeValue}vw, ${capPx.toFixed(1)}px)`, height: "auto" };
  }
  const capPx = (shard.sizeValue / 100) * REFERENCE_VH_PX;
  return { width: "auto", height: `min(${shard.sizeValue}vh, ${capPx.toFixed(1)}px)` };
}

export function HeroLayers({ tier }: { tier: ShardTier }) {
  return (
    <>
      {SHARDS.filter((shard) => shard.tier === tier).map((shard) => (
        <div
          key={shard.id}
          className={styles.shard}
          style={{
            left: `${shard.x}%`,
            top: `${shard.y}%`,
            opacity: shard.opacity,
            zIndex: shard.z,
            transform: `translate(-50%, -50%) rotate(${shard.rotate}deg)`,
          }}
        >
          <Image
            src={shard.src}
            alt=""
            width={shard.w}
            height={shard.h}
            className={styles.shardImg}
            style={{
              // Only one dimension is ever meaningfully set — the other
              // stays "auto" so the browser preserves the trimmed image's
              // real aspect ratio instead of stretching it.
              ...shardSize(shard),
              filter: shard.blur > 0 ? `blur(${shard.blur}px)` : undefined,
            }}
            // Every shard is inside the single-viewport hero (nothing is
            // ever "below the fold" here), so lazy-loading is actively
            // wrong — it raced the initial paint in testing. All eager.
            priority
            draggable={false}
          />
          {shard.withMemoryFragment && <MemoryFragment />}
        </div>
      ))}
    </>
  );
}
