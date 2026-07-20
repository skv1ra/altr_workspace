"use client";

import { useEffect, useState } from "react";

/**
 * Dev-only calibration aid for /hero-lab: overlays the reference screenshot
 * (same 1318x716 aspect ratio, object-fit: contain so it's never distorted)
 * at an adjustable low opacity so the composition can be aligned directly
 * against it. Toggled with the R key. pointer-events: none throughout —
 * it must never intercept clicks on the real page underneath.
 *
 * Gated on NODE_ENV as defense in depth even though /hero-lab itself
 * already 404s in production — this component would still no-op even if
 * it were ever reachable some other way.
 */
export function ReferenceOverlay() {
  const [visible, setVisible] = useState(false);
  const [opacityPct, setOpacityPct] = useState(35);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        setVisible((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden="true">
          <div className="relative h-full w-full" style={{ aspectRatio: "1318 / 716" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- dev-only calibration aid, not shipped/optimized */}
            <img
              src="/api/dev/reference-overlay"
              alt=""
              className="h-full w-full"
              style={{ objectFit: "contain", opacity: opacityPct / 100 }}
            />
          </div>
        </div>
      )}
      <div className="pointer-events-auto fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md bg-black/75 px-3 py-2 text-white">
        <span className="text-label">
          {visible ? `Reference ${opacityPct}%` : "Press R for reference overlay"}
        </span>
        {visible && (
          <input
            aria-label="Reference overlay opacity"
            type="range"
            min={0}
            max={50}
            value={opacityPct}
            onChange={(event) => setOpacityPct(Number(event.target.value))}
          />
        )}
      </div>
    </>
  );
}
