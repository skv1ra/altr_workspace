import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { Reveal } from "@/components/ui/Reveal";
import { setReducedMotionOverride } from "@/lib/motion";

// jsdom (this repo's test environment) does not implement IntersectionObserver
// at all — verified directly (ReferenceError) before adding this stub, which
// only needs to satisfy Framer Motion's whileInView constructor call; it never
// needs to actually fire for these tests (they assert presence, not animation).
beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = IntersectionObserverStub;
});

describe("Reveal", () => {
  afterEach(() => {
    setReducedMotionOverride(null);
  });

  it("renders children normally", () => {
    render(<Reveal>Visible content</Reveal>);
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("renders children when reduced motion is forced on", () => {
    setReducedMotionOverride(true);
    render(<Reveal>Reduced motion content</Reveal>);
    expect(screen.getByText("Reduced motion content")).toBeInTheDocument();
  });

  it("caps nested stagger delay at the max depth instead of growing unboundedly", () => {
    const many = Array.from({ length: 10 }, (_, i) => i);
    function Nested({ items }: { items: number[] }): ReactElement {
      if (items.length === 0) return <span data-testid="leaf">leaf</span>;
      const [, ...rest] = items;
      return (
        <Reveal>
          <Nested items={rest} />
        </Reveal>
      );
    }
    render(<Nested items={many} />);
    const leaf = screen.getByTestId("leaf");
    const innermostReveal = leaf.closest("[data-reveal-delay-seconds]") as HTMLElement;
    const delay = Number(innermostReveal.dataset.revealDelaySeconds);
    // MAX_STAGGER_DEPTH (4) * 0.06s step = 0.24s ceiling, regardless of the
    // 10 levels of nesting actually present.
    expect(delay).toBeLessThanOrEqual(4 * 0.06 + 1e-9);
  });

  it("SSR: the raw server-rendered HTML never leaves content permanently invisible without JS", () => {
    const html = renderToStaticMarkup(<Reveal>No-JS content</Reveal>);
    // The real risk: Framer Motion's `initial` fade-rise state IS baked into
    // server HTML as an inline style (useReducedMotion() is falsy with no
    // window), which would hide content forever if JS never runs.
    expect(html).toContain("opacity:0");
    // The mitigation: a per-instance <noscript> stylesheet forces it back to
    // visible with !important — this is what actually protects no-JS users,
    // regardless of Framer Motion's internals.
    expect(html).toContain("<noscript");
    expect(html).toContain("opacity: 1 !important");
    expect(html).toContain("No-JS content");
  });
});
