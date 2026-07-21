"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getReducedMotionOverride, setReducedMotionOverride } from "@/lib/motion";

type WidthTier = "desktop" | "mobile";

// A real mid-range phone width — comfortably inside the 768px container
// breakpoint HeroScene.module.css/HeroCopy.module.css key off, close to
// what this prompt's own manual-verification step (DevTools mobile
// emulation) uses.
const MOBILE_PREVIEW_WIDTH = "390px";

/**
 * /hero-lab tier preview switches (Prompt 017's own required deliverable —
 * "verify all tiers in /hero-lab preview switches"). Two independent
 * controls:
 *
 *  - Width tier: wraps `children` (HeroScene) in a container whose width
 *    this component controls directly. HeroScene's mobile composition is
 *    driven by a CSS *container* query on its own root, not a viewport
 *    media query (see HeroScene.module.css) specifically so this works —
 *    narrowing a wrapper div doesn't change the browser viewport, so a
 *    `@media` breakpoint could never be previewed this way. In production
 *    that wrapper is always 100% (full viewport width), so the container
 *    query's effective breakpoint is identical to a media query there;
 *    this is purely a dev-page affordance.
 *  - Reduced motion: reuses the same manual override already wired for the
 *    styleguide's own motion demo (`lib/motion.ts`), so it exercises the
 *    exact code path a real OS `prefers-reduced-motion: reduce` user hits,
 *    not a separate preview-only mechanism.
 *
 * `prefers-reduced-data` (ADR-008's third tier trigger) has no scriptable
 * override — it's a real network/user preference, not something JS can
 * force — so it isn't previewable here; DevTools' own Rendering panel
 * ("Emulate CSS media feature prefers-reduced-data") is the manual-
 * verification path for that one specifically, same as forcing a non-AVIF
 * codec for the format-fallback check.
 */
export function HeroTierPreview({ children }: { children: ReactNode }) {
  const [widthTier, setWidthTier] = useState<WidthTier>("desktop");
  const [reducedMotion, setReducedMotionState] = useState<boolean | null>(null);

  useEffect(() => {
    setReducedMotionState(getReducedMotionOverride());
  }, []);

  function toggleReducedMotion() {
    const next = reducedMotion ? null : true;
    setReducedMotionOverride(next);
    setReducedMotionState(next);
  }

  return (
    <>
      <div
        style={{
          width: widthTier === "mobile" ? MOBILE_PREVIEW_WIDTH : "100%",
          marginInline: widthTier === "mobile" ? "auto" : undefined,
          outline: widthTier === "mobile" ? "1px dashed rgba(0, 0, 0, 0.25)" : undefined,
        }}
      >
        {children}
      </div>
      <div className="pointer-events-auto fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-md bg-black/75 px-3 py-2 text-white">
        <span className="text-label">Tier preview</span>
        <button
          type="button"
          onClick={() => setWidthTier("desktop")}
          aria-pressed={widthTier === "desktop"}
          className="text-label underline-offset-4 hover:underline aria-pressed:underline"
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setWidthTier("mobile")}
          aria-pressed={widthTier === "mobile"}
          className="text-label underline-offset-4 hover:underline aria-pressed:underline"
        >
          Mobile (390px)
        </button>
        <button
          type="button"
          onClick={toggleReducedMotion}
          aria-pressed={reducedMotion === true}
          className="text-label underline-offset-4 hover:underline aria-pressed:underline"
        >
          Reduced motion: {reducedMotion ? "on" : "off"}
        </button>
      </div>
    </>
  );
}
