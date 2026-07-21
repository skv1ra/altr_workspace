import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroScene } from "@/components/hero/HeroScene";
import { HERO_CTA_LABEL, HERO_HEADLINE, HERO_SUBCOPY } from "@/components/hero/HeroCopy";

/*
 * Prompt 017's own required test: "hero renders copy and CTA without any
 * effect/mount hooks having run (static render assertion)". `render()`
 * from Testing Library wraps everything in `act()` and flushes effects
 * synchronously, so it can't prove this on its own — `renderToStaticMarkup`
 * is React's actual no-effects code path (server rendering never runs
 * `useEffect`/`useLayoutEffect` at all, on any version), so a passing
 * assertion here is a direct proof of the no-JS/legacy-browser fallback
 * requirement: everything a real browser would show with scripting
 * disabled entirely is already present in this string.
 */
describe("HeroScene static (no-effects) render", () => {
  it("includes the real headline, subcopy, and CTA in server-rendered markup", () => {
    const html = renderToStaticMarkup(<HeroScene />);

    expect(html).toContain(HERO_HEADLINE);
    expect(html).toContain(HERO_SUBCOPY);
    expect(html).toContain(HERO_CTA_LABEL);
  });

  it("includes the primary shard's <picture> fallback <img> in server-rendered markup", () => {
    const html = renderToStaticMarkup(<HeroScene />);

    expect(html).toContain("<picture>");
    expect(html).toContain("/assets/hero/shards-trimmed/shard-main");
  });

  it("includes the accessible memory-fragment list (not gated on client mount)", () => {
    const html = renderToStaticMarkup(<HeroScene />);

    expect(html).toContain('aria-label="Examples of remembered moments"');
  });
});
