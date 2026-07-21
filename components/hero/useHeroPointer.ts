"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotionSafe } from "@/lib/motion";

const LERP_FACTOR = 0.08;

export interface HeroPointerOffset {
  x: number;
  y: number;
}

/**
 * Smoothed pointer parallax for the hero scene. Maintains a lerp-smoothed,
 * normalized (-1..1) pointer position in the returned ref — consumers
 * (useHeroShardMotion) read `.current` directly each frame and write a
 * resolved px value straight to each shard element, rather than this hook
 * broadcasting a CSS custom property for many elements to each recompute a
 * calc() against (measured to cost real frames once combined with scroll —
 * see useHeroShardMotion's own comment and STATUS.md).
 *
 * A single rAF loop drives the lerp (not a React state update per frame —
 * that would re-render the whole scene tree ~60x/s); the loop suspends
 * itself whenever the hero is off-screen (IntersectionObserver) or the tab
 * is hidden (visibilitychange), and resumes when either condition clears.
 *
 * Reduced motion (`useReducedMotionSafe`, OS preference or the manual
 * override): the effect below returns immediately and never attaches
 * anything. The returned ref stays at its initial `{ x: 0, y: 0 }` forever,
 * which is what the required test asserts.
 */
export function useHeroPointer(sceneRef: RefObject<HTMLElement | null>): RefObject<HeroPointerOffset> {
  const reducedMotion = useReducedMotionSafe();
  const offsetRef = useRef<HeroPointerOffset>({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;

    const scene = sceneRef.current;
    if (!scene) return;

    const target: HeroPointerOffset = { x: 0, y: 0 };
    const current = offsetRef.current;
    let frame: number | undefined;
    let intersecting = true;

    function tick() {
      current.x += (target.x - current.x) * LERP_FACTOR;
      current.y += (target.y - current.y) * LERP_FACTOR;
      frame = shouldRun() ? requestAnimationFrame(tick) : undefined;
    }

    function shouldRun() {
      return intersecting && document.visibilityState === "visible";
    }

    function ensureLoop() {
      if (frame === undefined && shouldRun()) {
        frame = requestAnimationFrame(tick);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      // Edge case: touch/pen never sets a new target — parallax stays inert
      // rather than jumping to a touch point.
      if (event.pointerType !== "mouse") return;
      const bounds = scene!.getBoundingClientRect();
      // Ratios of the hero's own measured box, not raw client coordinates —
      // this is what keeps offsets correct under non-100% browser zoom
      // (clientX and bounds.width scale together, so the ratio doesn't
      // move), per this prompt's own edge case.
      target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }

    function handlePointerLeave() {
      target.x = 0;
      target.y = 0;
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

    scene.addEventListener("pointermove", handlePointerMove, { passive: true });
    scene.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    ensureLoop();

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      observer.disconnect();
      scene.removeEventListener("pointermove", handlePointerMove);
      scene.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [reducedMotion, sceneRef]);

  return offsetRef;
}
