"use client";

import Image from "next/image";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotionSafe } from "@/lib/motion";
import { HeroParticles } from "./HeroParticles";
import { MemoryFragment } from "./MemoryFragment";
import styles from "./HeroPrototype.module.css";

/*
 * Hybrid hero prototype (ADR-007): pre-rendered raster shards (copied
 * read-only from LEGACY's public/hero-shards/*.png) composed with fog
 * gradients, CSS depth-of-field, a canvas particle layer, pointer
 * parallax, and ambient drift.
 *
 * Revision 2 (after user visual review of rev 1): repositioned for
 * stronger cinematic depth (large mid-ground hero shard right-of-center,
 * a heavily-blurred foreground mass cropped bottom-right, smaller
 * far-background pieces), and added a CSS glass-enhancement pass per
 * shard (contrast/brightness lift + a mask-clipped diagonal sheen +
 * alpha-silhouette rim light via drop-shadow) to read less like matte
 * rock. This is presentation-only, applied on top of the existing PNGs —
 * it cannot add fracture geometry that isn't in the source pixels; finer
 * crack veins and true refraction need regenerated assets, which is
 * Prompt 013's job, not this prototype's.
 *
 * DESIGN_DIRECTION pointer-parallax caps: max ±10px foreground, ±4px
 * background, lerp-smoothed. `parallaxPx` below encodes each shard's own
 * cap (in-focus shards closer to 10, blurred/background ones near 4).
 */
type ShardDef = {
  id: string;
  src: string;
  w: number;
  h: number;
  left: number;
  top: number;
  width: number;
  tilt: number;
  dof: number;
  opacity: number;
  parallaxPx: number;
  driftDuration: number;
  driftDelay: number;
  zIndex: number;
};

const SHARDS: ShardDef[] = [
  // Large sharp mid-ground hero shard, right of center — carries the memory etching.
  { id: "main", src: "/hero-shards/shard-main.png", w: 1100, h: 1400, left: 32, top: 0, width: 62, tilt: -3, dof: 0, opacity: 1, parallaxPx: 10, driftDuration: 22, driftDelay: 0, zIndex: 4 },
  // Sharp companion, upper-left, balances the composition without crowding the left negative space.
  { id: "c", src: "/hero-shards/shard-c.png", w: 700, h: 980, left: 2, top: 34, width: 22, tilt: -16, dof: 0.6, opacity: 0.97, parallaxPx: 9, driftDuration: 26, driftDelay: -4, zIndex: 3 },
  // Mid-ground companion, right side, slightly softer.
  { id: "b", src: "/hero-shards/shard-b.png", w: 760, h: 900, left: 70, top: 42, width: 25, tilt: 12, dof: 1.6, opacity: 0.94, parallaxPx: 7, driftDuration: 24, driftDelay: -8, zIndex: 3 },
  // Large blurred dark foreground mass, cropped bottom-right by the viewport, like the reference.
  { id: "d", src: "/hero-shards/shard-d.png", w: 560, h: 640, left: 46, top: 58, width: 70, tilt: 22, dof: 13, opacity: 0.94, parallaxPx: 4, driftDuration: 32, driftDelay: -12, zIndex: 5 },
  // Small far-background pieces, softer blur, lower opacity — read as distant.
  { id: "e", src: "/hero-shards/shard-e.png", w: 520, h: 700, left: 76, top: -6, width: 13, tilt: -24, dof: 4, opacity: 0.55, parallaxPx: 4, driftDuration: 28, driftDelay: -16, zIndex: 1 },
  { id: "f", src: "/hero-shards/shard-f.png", w: 420, h: 480, left: 6, top: 2, width: 10, tilt: 30, dof: 4.5, opacity: 0.5, parallaxPx: 4, driftDuration: 25, driftDelay: -20, zIndex: 1 },
];

const LERP_FACTOR = 0.08;

export function HeroPrototype() {
  const reducedMotion = useReducedMotionSafe();
  const sceneRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>();

  useEffect(() => {
    if (reducedMotion) return;

    function tick() {
      const scene = sceneRef.current;
      if (scene) {
        const current = currentRef.current;
        const target = targetRef.current;
        current.x += (target.x - current.x) * LERP_FACTOR;
        current.y += (target.y - current.y) * LERP_FACTOR;
        scene.style.setProperty("--pointer-x", current.x.toFixed(4));
        scene.style.setProperty("--pointer-y", current.y.toFixed(4));
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    // Touch/pen: parallax stays inert (never updates) rather than broken.
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    targetRef.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };
  }

  function handlePointerLeave() {
    targetRef.current = { x: 0, y: 0 };
  }

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
    >
      <div className={styles.fog} />
      <HeroParticles className={styles.particles} reducedMotion={reducedMotion} maxParticles={40} />
      {SHARDS.map((shard) => (
        <div
          key={shard.id}
          className={`${styles.shard} ${reducedMotion ? "" : styles.shardDrift}`}
          style={
            {
              left: `${shard.left}%`,
              top: `${shard.top}%`,
              width: `${shard.width}%`,
              opacity: shard.opacity,
              zIndex: shard.zIndex,
              "--tilt": `${shard.tilt}deg`,
              "--dof": `${shard.dof}px`,
              "--parallax-px": reducedMotion ? 0 : shard.parallaxPx,
              "--dur": `${shard.driftDuration}s`,
              "--fdelay": `${shard.driftDelay}s`,
            } as React.CSSProperties
          }
        >
          <Image
            src={shard.src}
            alt=""
            width={shard.w}
            height={shard.h}
            className={styles.shardImg}
            priority={shard.id === "main"}
            draggable={false}
          />
          {shard.id === "main" && <MemoryFragment />}
        </div>
      ))}
    </div>
  );
}
