import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { useHeroPointer } from "@/components/hero/useHeroPointer";
import { useHeroScroll } from "@/components/hero/useHeroScroll";
import { setReducedMotionOverride } from "@/lib/motion";

// jsdom has no IntersectionObserver (same gap Prompt 011 hit and fixed the
// same way). Needed here even though every test below expects the reduced-
// motion path: Framer Motion's useReducedMotion() doesn't pick up a mocked
// matchMedia synchronously on first render (it defaults false until its own
// effect settles), so useHeroPointer's effect can run once through its
// "not reduced" branch — which touches IntersectionObserver — before the
// re-render with the real value unwinds it. No animation frame actually
// fires in that window (rAF is async, nothing flushes it synchronously in
// a plain `render()`), so the offsets this test asserts on are unaffected;
// this stub only stops that transient pass from throwing.
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

function MotionHarness() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const pointer = useHeroPointer(sceneRef);
  const scroll = useHeroScroll(sceneRef);
  return (
    <div ref={sceneRef} data-testid="scene">
      <span data-testid="pointer">{JSON.stringify(pointer.current)}</span>
      <span data-testid="scroll">{scroll.current}</span>
    </div>
  );
}

describe("hero motion hooks under reduced motion", () => {
  afterEach(() => {
    setReducedMotionOverride(null);
    vi.unstubAllGlobals();
  });

  it("return zero offsets when reduced motion is forced via the manual override", () => {
    setReducedMotionOverride(true);
    render(<MotionHarness />);

    expect(screen.getByTestId("pointer").textContent).toBe(JSON.stringify({ x: 0, y: 0 }));
    expect(screen.getByTestId("scroll").textContent).toBe("0");
  });

  // This prompt's own required-test wording ("mock matchMedia") — the OS-level
  // path Framer Motion's useReducedMotion() reads, independent of this repo's
  // manual override tested above.
  it("return zero offsets when the OS reports prefers-reduced-motion via matchMedia", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(<MotionHarness />);

    expect(screen.getByTestId("pointer").textContent).toBe(JSON.stringify({ x: 0, y: 0 }));
    expect(screen.getByTestId("scroll").textContent).toBe("0");
  });
});
