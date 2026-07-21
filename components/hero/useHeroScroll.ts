"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotionSafe } from "@/lib/motion";

/** "Over the first ~80vh of scroll" per this prompt's own instruction. */
const SCROLL_RANGE_VH_FACTOR = 0.8;

/**
 * Scroll choreography progress (0..1) over the hero's first ~80vh of
 * scroll. Writes to a `--scroll-progress` custom property on `sceneRef`'s
 * element; consumers (fog opacity, shard separation, headline drift) read
 * it via `calc(var(--scroll-progress, 0) * <own-effect>)` — transform/
 * opacity only, so this stays compositor-friendly with no layout
 * recalculation in the loop.
 *
 * rAF-throttled (a `ticking` flag coalesces bursts of scroll events down to
 * one update per frame) and passive. Reduced motion: the effect returns
 * immediately, `--scroll-progress` is never set, every consumer's
 * `var(--scroll-progress, 0)` fallback resolves to 0 — headline doesn't
 * drift, fog doesn't thin, shards don't separate. The returned ref stays at
 * its initial `0`, which the required test asserts.
 */
export function useHeroScroll(sceneRef: RefObject<HTMLElement | null>): RefObject<number> {
  const reducedMotion = useReducedMotionSafe();
  const progressRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    const scene = sceneRef.current;
    if (!scene) return;

    let ticking = false;

    function update() {
      ticking = false;
      const range = window.innerHeight * SCROLL_RANGE_VH_FACTOR;
      const progress = range > 0 ? Math.min(Math.max(window.scrollY / range, 0), 1) : 0;
      progressRef.current = progress;
      scene!.style.setProperty("--scroll-progress", progress.toFixed(4));
    }

    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reducedMotion, sceneRef]);

  return progressRef;
}
