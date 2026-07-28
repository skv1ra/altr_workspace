"use client";

import { useEffect, useState } from "react";

/*
 * Gates the WebGL glass layer (HeroGlassScene) to the environments where it
 * is a pure upgrade:
 *  - desktop-width viewports only — the mobile/reduced-data tier (ADR-008)
 *    keeps its lightweight @1x image composition untouched;
 *  - prefers-reduced-data honored, same as the shard <source> chain;
 *  - WebGL2 actually available (checked once, cached).
 *
 * Starts (and server-renders as) `false`: the image composition is always
 * the first paint, so LCP/CLS and the no-JS story are exactly what they
 * were before this layer existed. The glass mounts as a progressive
 * enhancement after hydration.
 */

let webgl2Support: boolean | undefined;

function supportsWebGL2(): boolean {
  if (webgl2Support === undefined) {
    try {
      webgl2Support = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      webgl2Support = false;
    }
  }
  return webgl2Support;
}

export function useHeroGlassEligibility(): boolean {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    // Same breakpoint as HeroScene.module.css's hero container query (the
    // hero spans the full viewport in production) and the shard <picture>
    // MOBILE_SOURCE_MEDIA in HeroLayers.
    const queries = [window.matchMedia("(max-width: 768px)"), window.matchMedia("(prefers-reduced-data: reduce)")];
    const update = () => setEligible(!queries.some((query) => query.matches) && supportsWebGL2());
    update();
    queries.forEach((query) => query.addEventListener("change", update));
    return () => queries.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return eligible;
}
