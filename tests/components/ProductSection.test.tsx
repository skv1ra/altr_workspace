import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ProductSection } from "@/components/site/ProductSection";
import { productCopy } from "@/lib/i18n/home-copy";
import { setStoredLanguage } from "@/lib/i18n/lang-store";

// jsdom has no IntersectionObserver — same gap Prompt 011's Reveal (used
// here) already hit; same stub already established for it elsewhere
// (tests/components/hero-lab-page.test.tsx, hero-motion-hooks.test.tsx).
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

describe("ProductSection", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the #product section with the EN eyebrow, title, body, and all three beats", () => {
    render(<ProductSection />);

    const section = document.getElementById("product");
    expect(section).toBeInTheDocument();
    expect(screen.getByText(productCopy.EN.eyebrow)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: productCopy.EN.title })).toBeInTheDocument();
    expect(screen.getByText(productCopy.EN.body)).toBeInTheDocument();
    for (const beat of productCopy.EN.beats) {
      expect(screen.getByText(beat.label)).toBeInTheDocument();
      expect(screen.getByText(beat.body)).toBeInTheDocument();
    }
  });

  it("renders the UA copy when the stored language preference is UA", () => {
    // useLang reads the stored preference synchronously in its own effect;
    // functional storage must be allowed first, same as HeroCopy/Header's
    // own lang-store usage — setStoredLanguage no-ops the write otherwise.
    window.localStorage.setItem("altr_cookie_preferences_v1", JSON.stringify({ functional: true }));
    setStoredLanguage("UA");

    render(<ProductSection />);

    expect(screen.getByRole("heading", { level: 2, name: productCopy.UA.title })).toBeInTheDocument();
    expect(screen.getByText(productCopy.UA.beats[0].label)).toBeInTheDocument();
  });

  it("keeps the memory-fragment caption decorative (aria-hidden), not part of the accessible content", () => {
    const { container } = render(<ProductSection />);
    const fragmentKicker = screen.getByText(productCopy.EN.fragmentKicker);
    const fragmentWrapper = fragmentKicker.closest('[aria-hidden="true"]');
    expect(fragmentWrapper).not.toBeNull();
    expect(container.querySelector("picture img")).toHaveAttribute("alt", "");
  });
});
