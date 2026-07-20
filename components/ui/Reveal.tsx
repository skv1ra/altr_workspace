"use client";

import { motion } from "framer-motion";
import { createContext, useContext, useId, type ReactNode } from "react";
import { fadeRise, transitions, useReducedMotionSafe, STAGGER_STEP_SECONDS } from "@/lib/motion";

/** Caps how far nested Reveals' stagger delay can grow — deeply nested
 *  content should not wait an unbounded number of steps to appear. */
const MAX_STAGGER_DEPTH = 4;

const RevealDepthContext = createContext(0);

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay in seconds, on top of the depth-based stagger. */
  delay?: number;
}

/**
 * Viewport-entry fade-rise with stagger context. Children are always
 * present in the DOM (never conditionally rendered) — with JS disabled the
 * inline "hidden" style Framer Motion computes during SSR is overridden by
 * a per-instance <noscript> stylesheet with !important, so content is
 * never permanently invisible without JS. With reduced motion (OS or the
 * manual override), the element skips straight to its visible state.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const depth = useContext(RevealDepthContext);
  const reducedMotion = useReducedMotionSafe();
  const id = useId();
  const staggerDelay = Math.min(depth, MAX_STAGGER_DEPTH) * STAGGER_STEP_SECONDS;
  const totalDelay = delay + staggerDelay;
  const selector = `[data-reveal-id="${id}"]`;

  return (
    <RevealDepthContext.Provider value={depth + 1}>
      <noscript>
        <style>{`${selector} { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <motion.div
        data-reveal-id={id}
        data-reveal-delay-seconds={totalDelay.toFixed(3)}
        className={className}
        initial={reducedMotion ? false : fadeRise.hidden}
        whileInView={reducedMotion ? undefined : fadeRise.visible}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ ...transitions.enter, delay: totalDelay }}
      >
        {children}
      </motion.div>
    </RevealDepthContext.Provider>
  );
}
