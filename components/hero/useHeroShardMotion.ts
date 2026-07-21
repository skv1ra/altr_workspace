"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotionSafe } from "@/lib/motion";
import type { HeroPointerOffset } from "./useHeroPointer";

export interface ShardMotionConfig {
  id: string;
  /** Pointer-parallax cap in px for this shard. */
  parallaxPx: number;
  /** Scroll-separation distance (px, signed) for this shard. */
  scrollDx: number;
  scrollDy: number;
}

/**
 * Applies combined pointer-parallax + scroll-separation offsets directly to
 * each shard element's `translate` CSS property — the individual transform
 * *property* (CSS Transforms Level 2), not the `transform: translate(...)`
 * function. It composes *before* `transform` in the rendering pipeline, so
 * it never touches a shard's own static `transform: translate(-50%,-50%)
 * rotate(...)` (set once, at render, in HeroLayers) — no string
 * concatenation, no per-frame transform recomputation.
 *
 * This exists specifically because the more "obvious" approach — each
 * shard's own inline `transform` reading
 * `calc(var(--pointer-x) * Npx + var(--scroll-progress) * Mpx)` — measured
 * real: combined pointer+scroll dropped to ~51-52 FPS (below this prompt's
 * 55 FPS floor), while pointer-only motion alone stayed ~60 FPS. Isolated
 * scroll-only motion, with the exact same real-scroll driving loop but
 * reduced motion forced (so no custom-property writes at all), also stayed
 * ~60 FPS — so the cost was specifically updating a CSS custom property
 * that 10 shard elements each recompute a calc() against on every change,
 * not real browser scrolling itself. Writing a plain resolved value
 * directly to only the elements that need it, with no custom-property
 * cascade for shards, restores ~59-60 FPS (see STATUS.md for the measured
 * before/after).
 *
 * `--scroll-progress` itself is kept (in useHeroScroll) for fog opacity and
 * the headline's own translateY — only 2-3 consumers, proven cheap even
 * while actively changing (this is what the "mouse only" measurement,
 * which left scroll-progress static at its initial value, couldn't have
 * told us in isolation, but the "reduced motion + real scroll" measurement
 * confirms: scrolling itself isn't the cost).
 *
 * Reduced motion: this effect returns immediately, no shard's `translate`
 * is ever set (initial value stays whatever HeroLayers set it to at
 * render, i.e. unset/"none") — identical to the 015 static scene.
 */
export function useHeroShardMotion(
  sceneRef: RefObject<HTMLElement | null>,
  shardElsRef: RefObject<Map<string, HTMLElement>>,
  pointerRef: RefObject<HeroPointerOffset>,
  scrollRef: RefObject<number>,
  configs: ShardMotionConfig[],
) {
  const reducedMotion = useReducedMotionSafe();

  useEffect(() => {
    if (reducedMotion) return;

    const scene = sceneRef.current;
    if (!scene) return;

    let frame: number | undefined;
    let intersecting = true;

    function shouldRun() {
      return intersecting && document.visibilityState === "visible";
    }

    function tick() {
      const pointer = pointerRef.current!;
      const scroll = scrollRef.current!;
      for (const config of configs) {
        const el = shardElsRef.current!.get(config.id);
        if (!el) continue;
        const x = pointer.x * config.parallaxPx + scroll * config.scrollDx;
        const y = pointer.y * config.parallaxPx + scroll * config.scrollDy;
        el.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      }
      frame = shouldRun() ? requestAnimationFrame(tick) : undefined;
    }

    function ensureLoop() {
      if (frame === undefined && shouldRun()) {
        frame = requestAnimationFrame(tick);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") ensureLoop();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        if (intersecting) ensureLoop();
      },
      { threshold: 0 },
    );
    observer.observe(scene);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    ensureLoop();

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reducedMotion, sceneRef, shardElsRef, pointerRef, scrollRef, configs]);
}
