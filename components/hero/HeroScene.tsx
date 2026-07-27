"use client";

import { useMemo, useRef } from "react";
import { HeroParticles } from "./HeroParticles";
import { HeroLayers, SHARDS, scrollSeparationPx } from "./HeroLayers";
import { HeroCopy } from "./HeroCopy";
import { HeroFragmentsAccessibleList } from "./HeroFragments";
import { useHeroPointer } from "./useHeroPointer";
import { useHeroScroll } from "./useHeroScroll";
import { useHeroShardMotion, type ShardMotionConfig } from "./useHeroShardMotion";
import { useReducedMotionSafe } from "@/lib/motion";
import styles from "./HeroScene.module.css";

/*
 * Final hero composition (Prompt 014, supersedes the Prompt 012 ADR-007
 * prototype — components/hero/HeroPrototype.tsx deleted). Layer order
 * matches this prompt's own recipe exactly:
 *   background fog wash -> far/mid shards -> headline block -> near shards
 *   (pre-blurred, overlapping viewport edges) -> particle canvas -> top fog
 *   veil.
 * Concretely: near/foreground shards render (and stack, via z-index — see
 * HeroLayers) *above* HeroCopy, not below it, so the depth-of-field story is
 * real (foreground nearer the "camera" than the text) rather than just a
 * label on otherwise-flat stacking.
 *
 * `min-height: 92vh` (in HeroScene.module.css) plus every shard's explicit
 * next/image width/height reserve the full layout before any image loads —
 * zero CLS by construction, not by measurement after the fact.
 *
 * Only the purely decorative layers (fog, shard field, particle canvas) are
 * aria-hidden; HeroCopy is real, readable content and is deliberately left
 * out of that boundary.
 *
 * Prompt 015 adds memory-fragment content, anchored inside individual
 * shards via HeroLayers (so fragments move with their glass) — those
 * per-shard glyphs are themselves aria-hidden decorative duplicates.
 * HeroFragmentsAccessibleList is the one real, accessible copy: visually
 * hidden, grouped under a single label, rendered here as ordinary (not
 * aria-hidden) content, right after HeroCopy.
 *
 * Prompt 016 adds the interactive motion layer on top of that same static
 * composition:
 *   - useHeroPointer / useHeroScroll maintain lerp-smoothed pointer offset
 *     and scroll progress in refs (no per-frame React state — that would
 *     re-render the whole scene tree ~60x/s).
 *   - useHeroShardMotion reads both refs each frame and writes a resolved
 *     `translate` value directly to each shard's DOM node (registered via
 *     `registerShardEl`, passed through HeroLayers) — bypassing CSS custom
 *     properties for shard transforms specifically, because measuring
 *     found that path cost real frames under combined pointer+scroll (see
 *     useHeroShardMotion's own comment and STATUS.md).
 *   - `--scroll-progress` is still set as a plain custom property (in
 *     useHeroScroll) for the two cheap consumers that don't need direct
 *     DOM writes: fog opacity (HeroScene.module.css) and the headline's own
 *     scroll drift (HeroCopy) — proven cheap even while actively changing.
 * Under reduced motion, none of the three hooks ever touch the DOM at all;
 * the scene renders pixel-identical to the 015 static version.
 * `reducedMotion` is computed once here and passed down (not re-derived per
 * component) so HeroLayers' drift-animation class and HeroParticles' dust
 * drift agree with the same signal.
 */
export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotionSafe();
  const pointerRef = useHeroPointer(sceneRef);
  const scrollRef = useHeroScroll(sceneRef);

  /*
   * The glass is the photographic shard renders themselves (the same
   * black-glass fracture renders as the scene reference in references/) —
   * no synthetic WebGL re-interpretation on top. The former Prompt 018
   * glass layer (components/hero/glass/) is intentionally unmounted: the
   * reference look is the real render, not a drawn imitation of it.
   */
  const shardElsRef = useRef(new Map<string, HTMLDivElement>());
  function registerShardEl(id: string, el: HTMLDivElement | null) {
    if (el) shardElsRef.current.set(id, el);
    else shardElsRef.current.delete(id);
  }

  const shardMotionConfigs = useMemo<ShardMotionConfig[]>(
    () =>
      SHARDS.map((shard) => {
        const { dx, dy } = scrollSeparationPx(shard);
        return { id: shard.id, parallaxPx: shard.parallaxPx, scrollDx: dx, scrollDy: dy };
      }),
    [],
  );

  useHeroShardMotion(sceneRef, shardElsRef, pointerRef, scrollRef, shardMotionConfigs);

  return (
    <div ref={sceneRef} className={styles.scene}>
      <div className={styles.fogBase} aria-hidden="true" />
      <div aria-hidden="true">
        <HeroLayers tier="back" reducedMotion={reducedMotion} registerShardEl={registerShardEl} />
      </div>
      <HeroCopy />
      <HeroFragmentsAccessibleList />
      <div aria-hidden="true">
        <HeroLayers tier="front" reducedMotion={reducedMotion} registerShardEl={registerShardEl} />
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      <div aria-hidden="true">
        <HeroParticles className={styles.particles} reducedMotion={reducedMotion} maxParticles={36} />
      </div>
      <div className={styles.fogVeil} aria-hidden="true" />
    </div>
  );
}
