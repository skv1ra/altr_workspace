import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { HowItWorks } from "@/components/site/HowItWorks";
import { howItWorksCopy } from "@/lib/i18n/home-copy";

// jsdom has no IntersectionObserver — Reveal (Prompt 011) needs it.
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

describe("HowItWorks", () => {
  it("renders the #how-it-works section with the heading and all three steps", () => {
    render(<HowItWorks />);

    expect(document.getElementById("how-it-works")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: howItWorksCopy.EN.title })).toBeInTheDocument();
    for (const step of howItWorksCopy.EN.steps) {
      expect(screen.getByRole("heading", { level: 3, name: step.title })).toBeInTheDocument();
      expect(screen.getByText(step.body)).toBeInTheDocument();
    }
  });

  it("copy claims match audited behavior: local parsing, edit/disable/delete, and review-before-send", () => {
    render(<HowItWorks />);
    // Guards against future copy drift silently introducing an
    // unaudited claim (e.g. "syncs live" or "sends automatically").
    expect(screen.getByText(/parsed locally in your browser/i)).toBeInTheDocument();
    expect(screen.getByText(/never uploaded/i)).toBeInTheDocument();
    expect(screen.getByText(/edit any memory, disable it, or delete it/i)).toBeInTheDocument();
    expect(screen.getByText(/yours to review — nothing sends itself/i)).toBeInTheDocument();
  });
});
