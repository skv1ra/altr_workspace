import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import StyleguidePage from "@/app/(public)/styleguide/page";

// The page now renders MotionDemo -> Reveal -> motion.div with whileInView,
// which needs IntersectionObserver — not implemented by jsdom (verified
// directly; see tests/components/Reveal.test.tsx for the same stub/note).
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

describe("styleguide page production gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound() when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => StyleguidePage()).toThrow();
  });

  it("renders the display headline outside production", () => {
    render(<StyleguidePage />);
    expect(screen.getByRole("heading", { name: /your past learns to remain/i })).toBeInTheDocument();
  });
});
