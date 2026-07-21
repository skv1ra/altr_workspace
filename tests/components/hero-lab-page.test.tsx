import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import HeroLabPage from "@/app/(public)/hero-lab/page";
import { HERO_HEADLINE } from "@/components/hero/HeroCopy";

// jsdom has no IntersectionObserver (verified directly — same gap Prompt 011
// hit for Reveal's whileInView and fixed the same way); Prompt 016's
// useHeroPointer now uses one to suspend its rAF loop when the hero is
// off-screen, and HeroScene (rendered by this page) uses that hook.
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

describe("hero-lab page production gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound() when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => HeroLabPage()).toThrow();
  });

  it("renders the fixed hero headline outside production", () => {
    render(<HeroLabPage />);
    expect(screen.getByRole("heading", { name: HERO_HEADLINE })).toBeInTheDocument();
  });
});
