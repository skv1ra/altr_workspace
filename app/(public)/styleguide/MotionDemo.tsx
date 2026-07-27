"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { setReducedMotionOverride, transitions } from "@/lib/motion";

/** Client-only demo wrapper, same pattern as ControlsDemo/OverlaysDemo. */
export function MotionDemo() {
  const [forced, setForced] = useState<boolean | null>(null);

  function setOverride(value: boolean | null) {
    setForced(value);
    setReducedMotionOverride(value);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOverride(true)}
          className={`btn control-focus ${forced === true ? "btn-primary" : "btn-secondary"}`}
        >
          Force reduced motion on
        </button>
        <button
          type="button"
          onClick={() => setOverride(false)}
          className={`btn control-focus ${forced === false ? "btn-primary" : "btn-secondary"}`}
        >
          Force reduced motion off
        </button>
        <button
          type="button"
          onClick={() => setOverride(null)}
          className={`btn control-focus ${forced === null ? "btn-primary" : "btn-secondary"}`}
        >
          Use OS preference
        </button>
      </div>

      <div>
        <p className="text-label uppercase text-text-muted">Micro (180ms hover lift)</p>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          transition={transitions.micro}
          className="btn btn-secondary control-focus mt-2"
        >
          Hover me
        </motion.button>
      </div>

      <div>
        <p className="text-label uppercase text-text-muted">Drift (24s ambient, CSS-only)</p>
        <div className="motion-drift mt-2 h-12 w-12 rounded-full bg-altr-white" aria-hidden="true" />
      </div>

      <div>
        <p className="text-label uppercase text-text-muted">Enter (Reveal, scroll into view)</p>
        <Reveal className="mt-2 rounded-lg surface-page hairline-top hairline-bottom px-6 py-8">
          <p className="text-body">
            This block fades and rises 12px when it enters the viewport. With reduced
            motion (OS or the toggle above) it appears immediately in its final state.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
