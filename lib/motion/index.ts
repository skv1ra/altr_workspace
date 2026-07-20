"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Framer Motion needs raw numbers/arrays, not CSS custom properties, so
 * these restate app/styles/tokens.css's motion tokens in JS form — keep
 * them in sync by hand:
 *   --ease-altr    -> EASE_ALTR
 *   --motion-fast  -> transitions.micro
 *   --motion-slow  -> transitions.enter
 *   --motion-drift -> transitions.drift
 *
 * DESIGN_DIRECTION's Motion section states ambient drift uses
 * cubic-bezier(0.22, 1, 0.36, 1) (== --ease-altr); this prompt's own
 * "drift 24s linear-alternate" note is read as describing the alternating
 * *direction* (repeatType: "mirror"), not a literal linear timing
 * function — the trailing "all on --ease-altr equivalents" clause covers
 * every preset including drift, and that's also what DESIGN_DIRECTION
 * says directly.
 */
export const EASE_ALTR = [0.22, 1, 0.36, 1] as const;

export const transitions = {
  /** 180ms — matches --motion-fast. Micro-interactions (hover/press). */
  micro: { duration: 0.18, ease: EASE_ALTR },
  /** 600ms — matches --motion-slow. Entrances. */
  enter: { duration: 0.6, ease: EASE_ALTR },
  /** 24s, alternating — matches --motion-drift. Ambient hero drift. */
  drift: { duration: 24, ease: EASE_ALTR, repeat: Infinity, repeatType: "mirror" as const },
} as const;

/** Fade-rise entrance: opacity 0->1, translateY 12px->0 — well under the
 *  16px visual ceiling from DESIGN_DIRECTION. */
export const fadeRise = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const;

/** 60ms stagger between children of a staggered container. */
export const STAGGER_STEP_SECONDS = 0.06;

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER_STEP_SECONDS },
  },
} as const;

const OVERRIDE_EVENT = "altr-reduced-motion-override";
let manualOverride: boolean | null = null;

/**
 * Dev/styleguide-only escape hatch to force reduced motion on/off
 * regardless of the OS preference — powers the styleguide's toggle so
 * motion can be demonstrated/verified without changing OS settings.
 */
export function setReducedMotionOverride(value: boolean | null) {
  manualOverride = value;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OVERRIDE_EVENT));
  }
}

export function getReducedMotionOverride() {
  return manualOverride;
}

/** Combines Framer's OS-level useReducedMotion() with the manual override
 *  above. Resolves to `false` (motion allowed) during SSR/before mount. */
export function useReducedMotionSafe(): boolean {
  const systemPreference = useReducedMotion();
  const [override, setOverride] = useState<boolean | null>(manualOverride);

  useEffect(() => {
    const handler = () => setOverride(manualOverride);
    window.addEventListener(OVERRIDE_EVENT, handler);
    return () => window.removeEventListener(OVERRIDE_EVENT, handler);
  }, []);

  if (override !== null) return override;
  return systemPreference ?? false;
}
