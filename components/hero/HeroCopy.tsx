import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Fixed per Prompt 014's own spec — exported so the required RTL test can
// assert against the same source of truth instead of a duplicated literal,
// which is what actually guards against copy drift.
export const HERO_HEADLINE = "Your past learns to remain.";
export const HERO_SUBCOPY = "A digital continuation of you, shaped by memory, style, and time.";
export const HERO_CTA_LABEL = "Create your Altr";
export const HERO_SECONDARY_LABEL = "How it works";

/**
 * Headline/CTA clear-space block. Positioned left 7%, top 31%, width 38%
 * (matches the reference's headline-left composition without copying it
 * pixel-for-pixel) — no shard in HeroLayers is placed inside this box at
 * any breakpoint (verified with real screenshots, see STATUS.md).
 *
 * Headline color is `--altr-obsidian` specifically (not the `--text-primary`
 * token, which resolves to the lighter `--altr-graphite` on this light
 * surface) — this prompt requires >= 7:1 measured contrast, and obsidian is
 * what was actually measured against the fog background to clear that bar.
 *
 * The headline wraps naturally (no forced <br/>) rather than a hard two-line
 * split: it keeps the fixed copy as one real text node (so the RTL test and
 * any future copy scan can just match the literal sentence), and it holds
 * up better than a fixed break at the ultra-wide/narrow edge cases this
 * prompt calls out.
 */
export function HeroCopy() {
  return (
    <div className="absolute z-10" style={{ left: "7%", top: "31%", width: "38%" }}>
      <h1
        style={{ fontSize: "clamp(56px, 5.16vw, 74px)" }}
        className="font-normal leading-[1.05] tracking-[-0.02em] text-altr-obsidian"
      >
        {HERO_HEADLINE}
      </h1>
      <p className="mt-6 max-w-sm text-body text-text-muted">{HERO_SUBCOPY}</p>
      <div className="mt-8 flex items-center gap-6">
        <Button variant="primary">{HERO_CTA_LABEL}</Button>
        <Link
          href="#how-it-works"
          className="text-body text-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:underline"
        >
          {HERO_SECONDARY_LABEL}
        </Link>
      </div>
    </div>
  );
}
