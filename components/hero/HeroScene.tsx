import { HeroParticles } from "./HeroParticles";
import { HeroLayers } from "./HeroLayers";
import { HeroCopy } from "./HeroCopy";
import styles from "./HeroScene.module.css";

/*
 * Final static hero composition (Prompt 014, supersedes the Prompt 012
 * ADR-007 prototype — components/hero/HeroPrototype.tsx deleted). Layer
 * order matches this prompt's own recipe exactly:
 *   background fog wash -> far/mid shards -> headline block -> near shards
 *   (pre-blurred, overlapping viewport edges) -> particle canvas -> top fog
 *   veil.
 * Concretely: near/foreground shards render (and stack, via z-index — see
 * HeroLayers) *above* HeroCopy, not below it, so the depth-of-field story is
 * real (foreground nearer the "camera" than the text) rather than just a
 * label on otherwise-flat stacking.
 *
 * Deliberately static: no pointer parallax, no drift animation (the
 * particle canvas is passed reducedMotion so it paints one still frame) —
 * this prompt's own objective is "compose the final static hero scene";
 * Prompt 016 owns pointer/scroll motion on top of this.
 *
 * `min-height: 92vh` (in HeroScene.module.css) plus every shard's explicit
 * next/image width/height reserve the full layout before any image loads —
 * zero CLS by construction, not by measurement after the fact.
 *
 * Only the purely decorative layers (fog, shard field, particle canvas) are
 * aria-hidden; HeroCopy is real, readable content and is deliberately left
 * out of that boundary.
 */
export function HeroScene() {
  return (
    <div className={styles.scene}>
      <div className={styles.fogBase} aria-hidden="true" />
      <div aria-hidden="true">
        <HeroLayers tier="back" />
      </div>
      <HeroCopy />
      <div aria-hidden="true">
        <HeroLayers tier="front" />
      </div>
      <div aria-hidden="true">
        <HeroParticles className={styles.particles} reducedMotion maxParticles={36} />
      </div>
      <div className={styles.fogVeil} aria-hidden="true" />
    </div>
  );
}
